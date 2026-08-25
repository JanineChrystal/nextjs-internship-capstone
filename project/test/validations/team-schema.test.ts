import { describe, expect, it } from "vitest";
import {
	CreateTeamSchema,
	TeamDescriptionSchema,
	TeamNameSchema,
	UpdateTeamSchema,
} from "@/lib/validations/team-schema";

describe("TeamNameSchema", () => {
	it("trims before validating, so whitespace is not a name", () => {
		/** trim before validate - the other order accepts "   " as a one-character name. */
		expect(TeamNameSchema.safeParse("   ").success).toBe(false);
	});

	it("returns the trimmed value", () => {
		expect(TeamNameSchema.parse("  Design  ")).toBe("Design");
	});

	it("rejects an empty name", () => {
		const result = TeamNameSchema.safeParse("");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Team name is required");
		}
	});

	it("accepts a name at the 80-character limit and rejects 81", () => {
		expect(TeamNameSchema.safeParse("a".repeat(80)).success).toBe(true);
		expect(TeamNameSchema.safeParse("a".repeat(81)).success).toBe(false);
	});
});

describe("TeamDescriptionSchema", () => {
	it("is optional", () => {
		expect(TeamDescriptionSchema.safeParse(undefined).success).toBe(true);
	});

	it("allows an empty string, unlike the name", () => {
		/** optional vs required - a team may have no description, never no name. */
		expect(TeamDescriptionSchema.safeParse("").success).toBe(true);
	});

	it("accepts 500 characters and rejects 501", () => {
		expect(TeamDescriptionSchema.safeParse("a".repeat(500)).success).toBe(true);
		expect(TeamDescriptionSchema.safeParse("a".repeat(501)).success).toBe(
			false,
		);
	});
});

describe("CreateTeamSchema", () => {
	it("defaults userIds to an empty array when absent", () => {
		const result = CreateTeamSchema.parse({ name: "Design" });

		expect(result.userIds).toEqual([]);
	});

	it("de-duplicates userIds", () => {
		/** duplicate picks - selecting a member and a group containing them would violate the unique constraint. */
		const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
		const result = CreateTeamSchema.parse({
			name: "Design",
			userIds: [id, id],
		});

		expect(result.userIds).toEqual([id]);
	});

	it("preserves distinct userIds", () => {
		const first = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
		const second = "3f2504e0-4f89-41d3-9a0c-0305e82c3302";
		const result = CreateTeamSchema.parse({
			name: "Design",
			userIds: [first, second],
		});

		expect(result.userIds).toHaveLength(2);
	});

	it("rejects a userId that is not a uuid", () => {
		const result = CreateTeamSchema.safeParse({
			name: "Design",
			userIds: ["not-a-uuid"],
		});

		expect(result.success).toBe(false);
	});

	it("requires a name", () => {
		expect(CreateTeamSchema.safeParse({ userIds: [] }).success).toBe(false);
	});
});

describe("UpdateTeamSchema", () => {
	it("allows a partial update with neither field", () => {
		expect(UpdateTeamSchema.safeParse({}).success).toBe(true);
	});

	it("still enforces the name rules when a name is given", () => {
		/** optional is not lax - absent is allowed, invalid is not. */
		expect(UpdateTeamSchema.safeParse({ name: "   " }).success).toBe(false);
		expect(UpdateTeamSchema.safeParse({ name: "a".repeat(81) }).success).toBe(
			false,
		);
	});
});
