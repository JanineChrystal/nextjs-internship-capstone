import { describe, expect, it } from "vitest";
import {
	CategoryColorSchema,
	EditCategorySchema,
} from "@/lib/validations/category-schema";

describe("CategoryColorSchema", () => {
	it("accepts valid 6-digit hex colours", () => {
		expect(CategoryColorSchema.safeParse("#ff0000").success).toBe(true);
		expect(CategoryColorSchema.safeParse("#00FF00").success).toBe(true);
		expect(CategoryColorSchema.safeParse("#123456").success).toBe(true);
	});

	it("rejects 3-digit hex colours", () => {
		expect(CategoryColorSchema.safeParse("#abc").success).toBe(false);
	});

	it("rejects missing #", () => {
		expect(CategoryColorSchema.safeParse("ff0000").success).toBe(false);
	});

	it("rejects named colours", () => {
		expect(CategoryColorSchema.safeParse("red").success).toBe(false);
	});
});

describe("EditCategorySchema", () => {
	it("rejects empty name", () => {
		expect(
			EditCategorySchema.safeParse({ name: "  ", color: "#ff0000" }).success,
		).toBe(false);
	});

	it("rejects name > 60 chars", () => {
		const longName = "A".repeat(61);
		expect(
			EditCategorySchema.safeParse({ name: longName, color: "#ff0000" }).success,
		).toBe(false);
	});

	it("accepts valid category", () => {
		expect(
			EditCategorySchema.safeParse({ name: "Design", color: "#ff0000" }).success,
		).toBe(true);
	});
});
