import { describe, expect, it } from "vitest";
import {
	CreateChecklistItemSchema,
	UpdateChecklistItemSchema,
} from "@/lib/validations/checklist-schema";

describe("CreateChecklistItemSchema", () => {
	it("accepts an empty title (by design for in-place creation)", () => {
		expect(CreateChecklistItemSchema.safeParse({ title: "" }).success).toBe(true);
	});

	it("trims whitespace from title", () => {
		const result = CreateChecklistItemSchema.safeParse({ title: "  Task  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe("Task");
		}
	});
});

describe("UpdateChecklistItemSchema", () => {
	it("rejects empty title when updating", () => {
		expect(UpdateChecklistItemSchema.safeParse({ title: "" }).success).toBe(false);
	});

	it("trims whitespace from title", () => {
		const result = UpdateChecklistItemSchema.safeParse({ title: "   Task   " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe("Task");
		}
	});

	it("accepts valid title and isCompleted flag", () => {
		expect(
			UpdateChecklistItemSchema.safeParse({ title: "Task", isCompleted: true })
				.success,
		).toBe(true);
		expect(
			UpdateChecklistItemSchema.safeParse({ isCompleted: false }).success,
		).toBe(true); // partial updates allowed
	});
});
