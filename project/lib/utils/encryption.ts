import crypto from "node:crypto";

/**
 * Application-level encryption for the small number of columns that hold
 * genuinely private content.
 *
 * ## What ENCRYPTION_KEY is, and why it is required
 *
 * `ENCRYPTION_KEY` is a 64-character hex string - 32 raw bytes - and it is the
 * secret that makes this encryption meaningful. AES is a public algorithm, so
 * the key is the only thing standing between a leaked database and readable
 * content. It belongs in `.env.local` locally and in the environment variables
 * of every deployment, and it is never committed.
 *
 * Generate one with:
 *
 *     node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
 *
 * This module used to fall back to `"0".repeat(64)` when the variable was
 * missing. That is worse than not encrypting at all: it looks like protection
 * in the schema and in code review, while the key is a constant that anyone
 * reading the repository already knows. A missing secret now throws, matching
 * how `lib/db/index.ts` and `lib/rate-limit.ts` already behave.
 *
 * The key is read on first use rather than at import, so a build that never
 * encrypts anything does not need the variable present - the same pattern the
 * Filipino profanity detector uses for its base URL.
 *
 * ## Why there is only one scheme here
 *
 * Every value is encrypted with a random IV (AES-256-GCM), so encrypting the
 * same text twice produces two unrelated ciphertexts. That is what stops the
 * database from leaking which rows share a value even while the encryption
 * holds.
 */

const IV_BYTES = 16;

// A KeyObject rather than a Buffer: Node's cipher types accept it directly,
// which is what lets this file drop the `as any` casts it used to carry.
let cachedKey: crypto.KeyObject | null = null;

function getKey(): crypto.KeyObject {
	if (cachedKey) return cachedKey;

	const hex = process.env.ENCRYPTION_KEY;

	if (!hex) {
		throw new Error(
			"ENCRYPTION_KEY is missing. Generate one with: node -e \"console.log(require('node:crypto').randomBytes(32).toString('hex'))\"",
		);
	}

	// Length is checked rather than padded. Padding a short key to size hides a
	// misconfiguration behind a weaker key, and the resulting ciphertext cannot
	// be read once the real key is supplied.
	if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
		throw new Error(
			`ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${hex.length} characters.`,
		);
	}

	cachedKey = crypto.createSecretKey(new Uint8Array(Buffer.from(hex, "hex")));
	return cachedKey;
}

/**
 * Encrypts one value, returning `iv:authTag:ciphertext` in hex.
 *
 * Null and empty inputs pass straight through, so a nullable column stays
 * nullable rather than gaining a ciphertext that decrypts to an empty string.
 */
export function encrypt(text: string): string;
export function encrypt(text: string | null | undefined): string | null;
export function encrypt(text: string | null | undefined): string | null {
	if (!text) return text ?? null;

	const iv = crypto.randomBytes(IV_BYTES);
	const cipher = crypto.createCipheriv(
		"aes-256-gcm",
		getKey(),
		new Uint8Array(iv),
	);

	const encrypted = Buffer.concat([
		new Uint8Array(cipher.update(text, "utf8")),
		new Uint8Array(cipher.final()),
	]).toString("hex");

	return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted}`;
}

/**
 * Reverses `encrypt`, and leaves anything it did not produce untouched.
 *
 * The pass-through matters during a migration: a table part-way through being
 * encrypted holds a mix of ciphertext and plaintext, and rows written before
 * the change must keep rendering rather than showing an error to the user.
 */
export function decrypt(text: string | null | undefined): string | null {
	if (!text) return text ?? null;

	const parts = text.split(":");
	if (parts.length !== 3) return text;

	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			getKey(),
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
		// A value that looks encrypted but will not decrypt means the key has
		// changed. Returning the raw string keeps the page rendering; the operator
		// sees ciphertext, which is the visible symptom of a key mismatch.
		return text;
	}
}
