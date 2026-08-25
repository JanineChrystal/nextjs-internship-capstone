import { describe, expect, it } from "vitest";
import {
	GroupNameSchema,
	SaveGroupSchema,
} from "@/lib/validations/group-schema";

describe("GroupNameSchema", () => {
	it("rejects empty names", () => {
		expect(GroupNameSchema.safeParse("").success).toBe(false);
		expect(GroupNameSchema.safeParse("   ").success).toBe(false);
	});

	it("rejects names longer than 80 chars", () => {
		const longName = "A".repeat(81);
		expect(GroupNameSchema.safeParse(longName).success).toBe(false);
	});

	it("accepts valid names and trims whitespace", () => {
		const result = GroupNameSchema.safeParse("  Design Team  ");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe("Design Team");
		}
	});
});

describe("SaveGroupSchema", () => {
	it("validates the name field", () => {
		expect(SaveGroupSchema.safeParse({ name: "Engineers" }).success).toBe(true);
		expect(SaveGroupSchema.safeParse({ name: "" }).success).toBe(false);
	});
});
