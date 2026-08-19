import crypto from "crypto";

// 32-byte key for AES-256
// In a real production app, ensure ENCRYPTION_KEY is a 64-character hex string in .env
const envKey = process.env.ENCRYPTION_KEY || "0".repeat(64);
const key = Buffer.from(envKey.padEnd(64, '0').slice(0, 64), 'hex'); 

// Static IV for deterministic encryption (16 bytes)
// This ensures that `encrypt(email)` always results in the same string, allowing DB lookups.
const envIv = process.env.DETERMINISTIC_IV || "0".repeat(32);
const DETERMINISTIC_IV = Buffer.from(envIv.padEnd(32, '0').slice(0, 32), 'hex');

/**
 * Standard Encryption (Non-Deterministic)
 * Uses AES-256-GCM with a random IV.
 * Best for: messages, notes, descriptions, names (if not searched)
 * Two identical plaintexts will yield DIFFERENT ciphertexts.
 */
export function encrypt(text: string | null | undefined): string | null {
	if (!text) return text as any;
	
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv("aes-256-gcm", key as any, iv as any);
	
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	const authTag = cipher.getAuthTag().toString("hex");
	
	// Format: iv:authTag:encryptedData
	return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Standard Decryption (Non-Deterministic)
 */
export function decrypt(text: string | null | undefined): string | null {
	if (!text) return text as any;
	
	// If it doesn't look like our encrypted format, return as is (for migration safety)
	if (!text.includes(":")) return text;
	
	try {
		const parts = text.split(":");
		if (parts.length !== 3) return text;
		
		const iv = Buffer.from(parts[0], "hex");
		const authTag = Buffer.from(parts[1], "hex");
		const encryptedText = Buffer.from(parts[2], "hex");
		
		const decipher = crypto.createDecipheriv("aes-256-gcm", key as any, iv as any);
		decipher.setAuthTag(authTag as any);
		
		let decrypted = decipher.update(encryptedText as any, undefined, "utf8");
		decrypted += decipher.final("utf8");
		
		return decrypted;
	} catch (error) {
		console.error("Decryption failed:", error);
		return text; // Fallback to raw text if decryption fails
	}
}

/**
 * Deterministic Encryption
 * Uses AES-256-CBC with a static IV.
 * Best for: emails, or fields you need to query exactly using WHERE email = ?
 * Two identical plaintexts will yield the SAME ciphertext.
 */
export function deterministicEncrypt(text: string | null | undefined): string | null {
	if (!text) return text as any;
	
	const cipher = crypto.createCipheriv("aes-256-cbc", key as any, DETERMINISTIC_IV as any);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	
	// Format: det:encryptedData
	return `det:${encrypted}`;
}

/**
 * Deterministic Decryption
 */
export function deterministicDecrypt(text: string | null | undefined): string | null {
	if (!text) return text as any;
	
	if (!text.startsWith("det:")) return text;
	
	try {
		const encryptedText = text.replace("det:", "");
		const decipher = crypto.createDecipheriv("aes-256-cbc", key as any, DETERMINISTIC_IV as any);
		
		let decrypted = decipher.update(encryptedText, "hex", "utf8");
		decrypted += decipher.final("utf8");
		
		return decrypted;
	} catch (error) {
		console.error("Deterministic decryption failed:", error);
		return text;
	}
}
