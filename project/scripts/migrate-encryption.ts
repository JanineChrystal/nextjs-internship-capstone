import crypto from "node:crypto";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

import { db } from "../lib/db/index";
import * as schema from "../lib/db/schema";

/**
 * Moves existing rows onto the current encryption policy.
 *
 * Three things changed at once, and each needs a different operation on data
 * that is already in the database:
 *
 *   1. Emails, names and task notes are no longer encrypted, because the app
 *      matches and searches on them. Those columns are DECRYPTED back to plain
 *      text so the lookups in project-members, workspace-members and global
 *      search start matching again.
 *   2. Comment bodies and contact messages stay encrypted, but the key changed
 *      from the all-zero fallback to a real secret, so they are RE-KEYED.
 *   3. Activity details, notification messages and checklist titles are newly
 *      encrypted, so they are ENCRYPTED for the first time.
 *
 * ## Why this script carries its own crypto
 *
 * It deliberately does not import `lib/utils/encryption`. That module reads one
 * key from the environment and now throws when it is missing - correct for the
 * app, useless here, because this script has to hold TWO keys at once: the old
 * one to read with and the new one to write with. Importing the app's module
 * would make the run depend on whichever key happened to be set.
 *
 * ## Running it
 *
 *   ENCRYPTION_KEY      the new key (required; also goes in .env.local)
 *   OLD_ENCRYPTION_KEY  the key the data was written with (optional; defaults
 *                       to the all-zero fallback the previous code used when
 *                       the variable was unset)
 *
 * Every step is idempotent, so a re-run is safe and a partial run can simply be
 * repeated.
 */

const ZERO_KEY = "0".repeat(64);
const ZERO_IV = "0".repeat(32);

function keyFrom(hex: string, label: string): crypto.KeyObject {
	if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
		throw new Error(
			`${label} must be 64 hex characters. Generate one with: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`,
		);
	}
	return crypto.createSecretKey(new Uint8Array(Buffer.from(hex, "hex")));
}

const oldKey = keyFrom(
	process.env.OLD_ENCRYPTION_KEY || ZERO_KEY,
	"OLD_ENCRYPTION_KEY",
);
const oldIv = Buffer.from(process.env.OLD_DETERMINISTIC_IV || ZERO_IV, "hex");
const newKey = keyFrom(process.env.ENCRYPTION_KEY || "", "ENCRYPTION_KEY");

/** Reads a value written by the old deterministic mode (`det:` + AES-256-CBC). */
function readDeterministic(value: string): string {
	if (!value.startsWith("det:")) return value;
	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			oldKey,
			new Uint8Array(oldIv),
		);
		return (
			decipher.update(value.slice(4), "hex", "utf8") + decipher.final("utf8")
		);
	} catch {
		return value;
	}
}

/** Reads a value written by the random-IV mode (`iv:authTag:data`, AES-256-GCM). */
function readRandom(value: string, key: crypto.KeyObject): string | null {
	const parts = value.split(":");
	if (parts.length !== 3) return null;
	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			key,
			new Uint8Array(Buffer.from(parts[0], "hex")),
		);
		decipher.setAuthTag(new Uint8Array(Buffer.from(parts[1], "hex")));
		return Buffer.concat([
			new Uint8Array(
				decipher.update(new Uint8Array(Buffer.from(parts[2], "hex"))),
			),
			new Uint8Array(decipher.final()),
		]).toString("utf8");
	} catch {
		return null;
	}
}

function writeRandom(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(
		"aes-256-gcm",
		newKey,
		new Uint8Array(iv),
	);
	const data = Buffer.concat([
		new Uint8Array(cipher.update(text, "utf8")),
		new Uint8Array(cipher.final()),
	]).toString("hex");
	return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${data}`;
}

/** Ciphertext under either key becomes plain text; plain text is left alone. */
function toPlain(value: string | null, deterministic: boolean): string | null {
	if (!value) return value;
	if (deterministic) return readDeterministic(value);
	return readRandom(value, oldKey) ?? readRandom(value, newKey) ?? value;
}

/** Plain text or old-key ciphertext becomes new-key ciphertext. */
function toNewKey(value: string | null, deterministic: boolean): string | null {
	if (!value) return value;
	// Already readable with the new key: nothing to do. This is what makes the
	// script safe to run twice.
	if (readRandom(value, newKey) !== null) return value;

	const plain = deterministic
		? readDeterministic(value)
		: (readRandom(value, oldKey) ?? value);

	return writeRandom(plain);
}

type FieldPlan = {
	column: string;
	deterministic: boolean;
	to: "plain" | "newKey";
};

// biome-ignore lint/suspicious/noExplicitAny: one generic writer across many tables
type AnyTable = any;

async function convert(table: AnyTable, fields: FieldPlan[]): Promise<number> {
	const rows: Record<string, unknown>[] = await db.select().from(table);
	let changed = 0;

	for (const row of rows) {
		const patch: Record<string, string | null> = {};

		for (const field of fields) {
			const current = (row[field.column] ?? null) as string | null;
			const next =
				field.to === "plain"
					? toPlain(current, field.deterministic)
					: toNewKey(current, field.deterministic);
			if (next !== current) patch[field.column] = next;
		}

		if (Object.keys(patch).length === 0) continue;

		await db
			.update(table)
			.set(patch)
			.where(eq(table.id, row.id as string));
		changed++;
	}

	return changed;
}

const steps: { label: string; run: () => Promise<number> }[] = [
	{
		label: "Users: email, firstName, lastName -> plain text",
		run: () =>
			convert(schema.users, [
				{ column: "email", deterministic: true, to: "plain" },
				{ column: "firstName", deterministic: false, to: "plain" },
				{ column: "lastName", deterministic: false, to: "plain" },
			]),
	},
	{
		label: "PendingInvites: email -> plain text",
		run: () =>
			convert(schema.pendingInvites, [
				{ column: "email", deterministic: true, to: "plain" },
			]),
	},
	{
		label: "Tasks: notes -> plain text",
		run: () =>
			convert(schema.tasks, [
				{ column: "notes", deterministic: false, to: "plain" },
			]),
	},
	{
		label: "Comments: body -> new key",
		run: () =>
			convert(schema.comments, [
				{ column: "body", deterministic: false, to: "newKey" },
			]),
	},
	{
		label: "ContactMessages: name, email, organization, message -> new key",
		run: () =>
			convert(schema.contactMessages, [
				{ column: "name", deterministic: false, to: "newKey" },
				{ column: "email", deterministic: true, to: "newKey" },
				{ column: "organization", deterministic: false, to: "newKey" },
				{ column: "message", deterministic: false, to: "newKey" },
			]),
	},
	{
		label: "ActivityLogs: details -> encrypted",
		run: () =>
			convert(schema.activityLogs, [
				{ column: "details", deterministic: false, to: "newKey" },
			]),
	},
	{
		label: "Notifications: message -> encrypted",
		run: () =>
			convert(schema.notifications, [
				{ column: "message", deterministic: false, to: "newKey" },
			]),
	},
	{
		label: "Checklists: title -> encrypted",
		run: () =>
			convert(schema.checklists, [
				{ column: "title", deterministic: false, to: "newKey" },
			]),
	},
];

async function main() {
	const host = new URL(
		(process.env.DATABASE_URL ?? "").replace("postgresql://", "http://"),
	).hostname;

	console.log(`Encryption migration\ntarget: ${host}\n`);

	for (const step of steps) {
		const changed = await step.run();
		const count = changed === 0 ? "  --" : String(changed).padStart(4);
		console.log(`  ${count}  ${step.label}`);
	}

	console.log("\nDone.");
	process.exit(0);
}

main().catch((error) => {
	console.error("Migration failed:", error);
	process.exit(1);
});
