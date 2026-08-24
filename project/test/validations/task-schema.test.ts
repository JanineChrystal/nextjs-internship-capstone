import { describe, expect, it } from "vitest";
import {
	GridTaskSchema,
	moveTaskSchema,
	TaskPrioritySchema,
	updateTaskSchema,
} from "@/lib/validations/task-schema";

describe("TaskPrioritySchema", () => {
	it("accepts valid priorities", () => {
		expect(TaskPrioritySchema.safeParse("low").success).toBe(true);
		expect(TaskPrioritySchema.safeParse("medium").success).toBe(true);
		expect(TaskPrioritySchema.safeParse("high").success).toBe(true);
		expect(TaskPrioritySchema.safeParse("urgent").success).toBe(true);
	});

	it("rejects invalid priorities", () => {
		expect(TaskPrioritySchema.safeParse("critical").success).toBe(false);
		expect(TaskPrioritySchema.safeParse("").success).toBe(false);
	});
});

describe("updateTaskSchema", () => {
	it("accepts partial fields", () => {
		expect(updateTaskSchema.safeParse({ name: "New Name" }).success).toBe(true);
		expect(updateTaskSchema.safeParse({ priority: "high" }).success).toBe(true);
		expect(updateTaskSchema.safeParse({}).success).toBe(true);
	});

	it("rejects invalid enum values", () => {
		expect(updateTaskSchema.safeParse({ priority: "critical" }).success).toBe(
			false,
		);
	});
});

describe("moveTaskSchema", () => {
	it("requires taskId and newBoardId", () => {
		expect(
			moveTaskSchema.safeParse({ taskId: "t1", newBoardId: "b2" }).success,
		).toBe(true);
		expect(moveTaskSchema.safeParse({ taskId: "t1" }).success).toBe(false);
		expect(moveTaskSchema.safeParse({ newBoardId: "b2" }).success).toBe(false);
	});
});

describe("GridTaskSchema", () => {
	it("accepts a full valid grid task", () => {
		const payload = {
			id: "t1",
			name: "Task",
			priority: "high",
			isCompleted: false,
			status: "In Progress",
			startDate: "2026-01-01",
			dueDate: "2026-01-02",
			board: "Board",
			assignees: [],
		};
		expect(GridTaskSchema.safeParse(payload).success).toBe(true);
	});

	it("rejects missing status", () => {
		const payload = {
			id: "t1",
			name: "Task",
			priority: "high",
			isCompleted: false,
			startDate: "2026-01-01",
			dueDate: "2026-01-02",
			board: "Board",
			assignees: [],
		};
		expect(GridTaskSchema.safeParse(payload).success).toBe(false);
	});
});
