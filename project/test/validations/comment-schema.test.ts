import { describe, expect, it } from "vitest";
import {
	CreateCommentSchema,
	UpdateCommentSchema,
} from "@/lib/validations/comment-schema";

describe("CreateCommentSchema", () => {
	it("accepts valid body and optional parentId", () => {
		expect(CreateCommentSchema.safeParse({ body: "Hello" }).success).toBe(true);
		expect(
			CreateCommentSchema.safeParse({ body: "Hello", parentId: "p1" }).success,
		).toBe(true);
	});

	it("rejects empty body", () => {
		expect(CreateCommentSchema.safeParse({ body: "" }).success).toBe(false);
	});

	it("trims whitespace from body", () => {
		const result = CreateCommentSchema.safeParse({ body: "  Hello  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.body).toBe("Hello");
		}
	});
});

describe("UpdateCommentSchema", () => {
	it("accepts valid body", () => {
		expect(UpdateCommentSchema.safeParse({ body: "Hello" }).success).toBe(true);
	});

	it("rejects empty body", () => {
		expect(UpdateCommentSchema.safeParse({ body: "" }).success).toBe(false);
	});
});
