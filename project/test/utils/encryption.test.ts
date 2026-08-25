import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Save the original env
const originalEnv = { ...process.env };

describe("encryption", () => {
	beforeEach(() => {
		vi.resetModules();
		// A valid 32-byte hex key required for testing
		process.env.ENCRYPTION_KEY =
			"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns null or input when input is null or empty", async () => {
		const { encrypt, decrypt } = await import("@/lib/utils/encryption");
		expect(encrypt(null)).toBeNull();
		expect(encrypt("")).toBe(""); // Passes empty string through
		expect(decrypt(null)).toBeNull();
		expect(decrypt("")).toBe("");
	});

	it("round-trips a string", async () => {
		const { encrypt, decrypt } = await import("@/lib/utils/encryption");
		const plain = "Hello, world!";
		const cipher = encrypt(plain);
		expect(cipher).not.toBeNull();
		expect(cipher).not.toBe(plain);
		expect(decrypt(cipher)).toBe(plain);
	});

	it("produces different ciphertexts for the same plaintext due to random IV", async () => {
		const { encrypt, decrypt } = await import("@/lib/utils/encryption");
		const plain = "Secret data";
		const cipher1 = encrypt(plain);
		const cipher2 = encrypt(plain);
		expect(cipher1).not.toEqual(cipher2);
		expect(decrypt(cipher1)).toBe(plain);
		expect(decrypt(cipher2)).toBe(plain);
	});

	it("returns the input unchanged when decrypting non-ciphertext", async () => {
		const { decrypt } = await import("@/lib/utils/encryption");
		// Doesn't contain the ":" delimiter
		const notCipher = "Just plain text";
		expect(decrypt(notCipher)).toBe(notCipher);
	});

	it("throws when ENCRYPTION_KEY is missing", async () => {
		delete process.env.ENCRYPTION_KEY;
		const { encrypt } = await import("@/lib/utils/encryption");
		expect(() => encrypt("text")).toThrow("ENCRYPTION_KEY");
	});

	it("throws when ENCRYPTION_KEY is the wrong length", async () => {
		process.env.ENCRYPTION_KEY = "too-short";
		const { encrypt } = await import("@/lib/utils/encryption");
		expect(() => encrypt("text")).toThrow("ENCRYPTION_KEY");
	});
});
