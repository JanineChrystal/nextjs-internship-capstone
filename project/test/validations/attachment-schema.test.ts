import { describe, expect, it } from "vitest";
import { CreateAttachmentSchema } from "@/lib/validations/attachment-schema";

describe("CreateAttachmentSchema", () => {
	it("accepts valid attachments", () => {
		expect(
			CreateAttachmentSchema.safeParse({
				name: "file.png",
				url: "http://example.com/file.png",
				type: "file",
			}).success,
		).toBe(true);
	});

	it("rejects invalid URLs", () => {
		expect(
			CreateAttachmentSchema.safeParse({
				name: "file",
				url: "not-a-url",
				type: "link",
			}).success,
		).toBe(false);
	});

	it("rejects missing name", () => {
		expect(
			CreateAttachmentSchema.safeParse({
				name: "",
				url: "http://example.com/file",
				type: "file",
			}).success,
		).toBe(false);
	});

	it("rejects unknown types", () => {
		expect(
			CreateAttachmentSchema.safeParse({
				name: "file",
				url: "http://example.com/file",
				type: "unknown",
			}).success,
		).toBe(false);
	});
});
