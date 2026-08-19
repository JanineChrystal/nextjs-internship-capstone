import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { encrypt, deterministicEncrypt } from "../lib/utils/encryption";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { db } from "../lib/db/index";

async function isAlreadyEncrypted(val: string | null, isDeterministic: boolean) {
	if (!val) return true;
	if (isDeterministic) {
		return val.startsWith("det:");
	}
	const parts = val.split(":");
	return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}

async function main() {
	console.log("Starting encryption migration...");

	// 1. Users
	const allUsers = await db.select().from(schema.users);
	console.log(`Found ${allUsers.length} users.`);
	for (const u of allUsers) {
		const updateData: any = {};
		
		if (!await isAlreadyEncrypted(u.email, true) && u.email) {
			updateData.email = deterministicEncrypt(u.email);
		}
		if (!await isAlreadyEncrypted(u.firstName, false) && u.firstName) {
			updateData.firstName = encrypt(u.firstName);
		}
		if (!await isAlreadyEncrypted(u.lastName, false) && u.lastName) {
			updateData.lastName = encrypt(u.lastName);
		}
		
		if (Object.keys(updateData).length > 0) {
			// update user
			await db.update(schema.users).set(updateData).where(eq(schema.users.id, u.id));
		}
	}

	// 2. Contact Messages
	const allContacts = await db.select().from(schema.contactMessages);
	console.log(`Found ${allContacts.length} contact messages.`);
	for (const c of allContacts) {
		const updateData: any = {};
		
		if (!await isAlreadyEncrypted(c.email, true) && c.email) {
			updateData.email = deterministicEncrypt(c.email);
		}
		if (!await isAlreadyEncrypted(c.name, false) && c.name) {
			updateData.name = encrypt(c.name);
		}
		if (!await isAlreadyEncrypted(c.organization, false) && c.organization) {
			updateData.organization = encrypt(c.organization);
		}
		if (!await isAlreadyEncrypted(c.message, false) && c.message) {
			updateData.message = encrypt(c.message);
		}

		if (Object.keys(updateData).length > 0) {
			await db.update(schema.contactMessages).set(updateData).where(eq(schema.contactMessages.id, c.id));
		}
	}

	// 3. Pending Invites
	const allInvites = await db.select().from(schema.pendingInvites);
	console.log(`Found ${allInvites.length} pending invites.`);
	for (const i of allInvites) {
		if (!await isAlreadyEncrypted(i.email, true) && i.email) {
			await db.update(schema.pendingInvites).set({ email: deterministicEncrypt(i.email) as any }).where(eq(schema.pendingInvites.id, i.id));
		}
	}

	// 4. Tasks (Notes)
	const allTasks = await db.select().from(schema.tasks);
	console.log(`Found ${allTasks.length} tasks.`);
	for (const t of allTasks) {
		if (!await isAlreadyEncrypted(t.notes, false) && t.notes) {
			await db.update(schema.tasks).set({ notes: encrypt(t.notes) as any }).where(eq(schema.tasks.id, t.id));
		}
	}

	// 5. Comments (Body)
	const allComments = await db.select().from(schema.comments);
	console.log(`Found ${allComments.length} comments.`);
	for (const c of allComments) {
		if (!await isAlreadyEncrypted(c.body, false) && c.body) {
			await db.update(schema.comments).set({ body: encrypt(c.body) as any }).where(eq(schema.comments.id, c.id));
		}
	}

	console.log("Encryption migration complete.");
	process.exit(0);
}

main().catch(err => {
	console.error("Migration failed:", err);
	process.exit(1);
});
