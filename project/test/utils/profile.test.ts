import { describe, expect, it } from "vitest";
import {
	completionPercentage,
	initialsOf,
	toProfileStatus,
} from "@/lib/utils/profile";

describe("toProfileStatus", () => {
	it("reports a completed task as Completed", () => {
		expect(toProfileStatus({ isCompleted: true, status: "In Progress" })).toBe(
			"Completed",
		);
	});

	it("lets isCompleted win over a stale text status", () => {
		/** the authoritative flag - the schema keeps isCompleted independent of status, so a finished task whose text status was never updated must still read Completed. */
		expect(toProfileStatus({ isCompleted: true, status: "Not Started" })).toBe(
			"Completed",
		);
	});

	it("maps the default status to To Do", () => {
		expect(toProfileStatus({ isCompleted: false, status: "Not Started" })).toBe(
			"To Do",
		);
	});

	it("treats any other unfinished status as In Progress", () => {
		expect(toProfileStatus({ isCompleted: false, status: "Blocked" })).toBe(
			"In Progress",
		);
		expect(toProfileStatus({ isCompleted: false, status: "In Review" })).toBe(
			"In Progress",
		);
	});
});

describe("initialsOf", () => {
	it("takes the first letter of the first two words", () => {
		expect(initialsOf("Alice Smith")).toBe("AS");
	});

	it("stops at two letters for a longer name", () => {
		expect(initialsOf("Maria Clara de Los Santos")).toBe("MC");
	});

	it("handles a single-word name", () => {
		expect(initialsOf("Prince")).toBe("P");
	});

	it("survives extra whitespace", () => {
		/** names arrive from a trim-and-join, so a missing surname leaves a trailing space. */
		expect(initialsOf("  Alice   Smith  ")).toBe("AS");
	});

	it("returns an empty string for an empty name", () => {
		expect(initialsOf("")).toBe("");
		expect(initialsOf("   ")).toBe("");
	});

	it("uppercases a lowercase name", () => {
		expect(initialsOf("bob jones")).toBe("BJ");
	});
});

describe("completionPercentage", () => {
	it("rounds to a whole percent", () => {
		expect(completionPercentage(1, 3)).toBe(33);
		expect(completionPercentage(2, 3)).toBe(67);
	});

	it("returns 0 rather than NaN when there are no tasks", () => {
		/** reachable since the profile started listing shared projects the person has no tasks in - dividing there renders "NaN%" and an empty bar. */
		expect(completionPercentage(0, 0)).toBe(0);
		expect(Number.isNaN(completionPercentage(0, 0))).toBe(false);
	});

	it("returns 0 for a negative total rather than a negative percent", () => {
		expect(completionPercentage(0, -1)).toBe(0);
	});

	it("reports a fully complete project as 100", () => {
		expect(completionPercentage(4, 4)).toBe(100);
	});
});
