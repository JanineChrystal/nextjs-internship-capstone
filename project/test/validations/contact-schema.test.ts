import { describe, expect, it } from "vitest";
import { ContactMessageSchema } from "@/lib/validations/contact-schema";

describe("ContactMessageSchema", () => {
	it("accepts a valid payload", () => {
		const payload = {
			name: "Alice",
			email: "alice@example.com",
			organization: "Acme Corp",
			topic: "support",
			message: "I need some help with this feature.",
			website: "", // Honeypot must be empty
		};
		expect(ContactMessageSchema.safeParse(payload).success).toBe(true);
	});

	it("rejects missing or empty name", () => {
		const payload = {
			email: "alice@example.com",
			topic: "support",
			message: "I need some help with this feature.",
			website: "",
		};
		expect(ContactMessageSchema.safeParse(payload).success).toBe(false);
		expect(
			ContactMessageSchema.safeParse({ ...payload, name: "  " }).success,
		).toBe(false);
	});

	it("rejects invalid email", () => {
		const payload = {
			name: "Alice",
			email: "not-an-email",
			topic: "support",
			message: "I need some help with this feature.",
			website: "",
		};
		expect(ContactMessageSchema.safeParse(payload).success).toBe(false);
	});

	it("rejects filled honeypot", () => {
		const payload = {
			name: "Alice",
			email: "alice@example.com",
			topic: "support",
			message: "I need some help with this feature.",
			website: "http://spam.com", // Bot filled it in
		};
		expect(ContactMessageSchema.safeParse(payload).success).toBe(false);
	});

	it("rejects too short message", () => {
		const payload = {
			name: "Alice",
			email: "alice@example.com",
			topic: "support",
			message: "short", // min 10
			website: "",
		};
		expect(ContactMessageSchema.safeParse(payload).success).toBe(false);
	});
});
