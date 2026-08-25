import { describe, expect, it } from "vitest";
import type { DbTask } from "@/lib/types/task";
import { describeTaskChanges } from "@/lib/utils/activity";

function makeTask(overrides: Partial<DbTask> = {}): DbTask {
	return {
		id: "t1",
		projectId: "p1",
		boardId: "b1",
		position: 0,
		name: "My Task",
		category: null,
		priority: "medium",
		status: "Not Started",
		isCompleted: false,
		statusOverriddenAt: null,
		previousBoardId: null,
		startDate: null,
		dueDate: null,
		notes: null,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		deletedAt: null,
		archivedAt: null,
		...overrides,
	};
}

describe("describeTaskChanges", () => {
	it("returns null when nothing changed", () => {
		const task = makeTask();
		expect(describeTaskChanges(task, task)).toBeNull();
	});

	it("detects a name change", () => {
		const before = makeTask({ name: "Old" });
		const after = makeTask({ name: "New" });
		const result = describeTaskChanges(before, after);
		expect(result).toContain("Changed name from Old to New");
	});

	it("detects a category change from null to a value", () => {
		const before = makeTask({ category: null });
		const after = makeTask({ category: "Design" });
		const result = describeTaskChanges(before, after);
		expect(result).toContain("Changed category from none to Design");
	});

	it("detects a priority change", () => {
		const before = makeTask({ priority: "low" });
		const after = makeTask({ priority: "high" });
		expect(describeTaskChanges(before, after)).toContain(
			"Changed priority from low to high",
		);
	});

	it("detects a status change", () => {
		const before = makeTask({ status: "Not Started" });
		const after = makeTask({ status: "In Progress" });
		expect(describeTaskChanges(before, after)).toContain(
			"Changed status from Not Started to In Progress",
		);
	});

	it("formats dates as YYYY-MM-DD", () => {
		const before = makeTask({ dueDate: null });
		const after = makeTask({ dueDate: new Date("2026-03-15") });
		expect(describeTaskChanges(before, after)).toContain("2026-03-15");
	});

	it("capitalises the first letter of the sentence", () => {
		const before = makeTask({ name: "Old" });
		const after = makeTask({ name: "New" });
		const result = describeTaskChanges(before, after) || "";
		expect(result[0]).toBe(result[0]?.toUpperCase());
	});

	it("joins multiple changes with a semicolon", () => {
		const before = makeTask({ name: "Old", priority: "low" });
		const after = makeTask({ name: "New", priority: "high" });
		const result = describeTaskChanges(before, after) || "";
		expect(result).toContain(";");
	});

	it("treats two Date objects with the same timestamp as unchanged", () => {
		const d = new Date("2026-01-01");
		const before = makeTask({ dueDate: d });
		const after = makeTask({ dueDate: new Date(d.getTime()) });
		expect(describeTaskChanges(before, after)).toBeNull();
	});

	it("treats an invalid Date as none", () => {
		const before = makeTask({ dueDate: new Date("invalid") });
		const after = makeTask({ dueDate: null });
		expect(describeTaskChanges(before, after)).toContain(
			"Changed due date from none to none",
		);
	});
});
