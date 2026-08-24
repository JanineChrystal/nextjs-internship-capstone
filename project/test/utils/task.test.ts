import { describe, expect, it } from "vitest";
import type { GridTask } from "@/lib/types/task";
import { hasIncompleteChecklist } from "@/lib/utils/task";

describe("hasIncompleteChecklist", () => {
	it("returns false for undefined checklist", () => {
		expect(hasIncompleteChecklist(undefined)).toBe(false);
	});

	it("returns false for an empty checklist", () => {
		expect(
			hasIncompleteChecklist({ checklist: [] } as unknown as GridTask),
		).toBe(false);
	});

	it("returns false when all items are completed", () => {
		const list = [
			{ id: "1", title: "A", completed: true },
			{ id: "2", title: "B", completed: true },
		];
		expect(
			hasIncompleteChecklist({ checklist: list } as unknown as GridTask),
		).toBe(false);
	});

	it("returns true when any item is incomplete", () => {
		const list = [
			{ id: "1", title: "A", completed: true },
			{ id: "2", title: "B", completed: false }, // incomplete!
		];
		expect(
			hasIncompleteChecklist({ checklist: list } as unknown as GridTask),
		).toBe(true);
	});
});
