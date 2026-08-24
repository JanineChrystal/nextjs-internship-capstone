import { describe, expect, it } from "vitest";
import {
	deriveTaskStatus,
	isTaskOverdue,
	toStatusBucket,
} from "@/lib/utils/task-status";

describe("isTaskOverdue", () => {
	it("returns false when the task is already completed", () => {
		const pastDue = new Date();
		pastDue.setDate(pastDue.getDate() - 1);
		expect(isTaskOverdue({ isCompleted: true, dueDate: pastDue })).toBe(false);
	});

	it("returns false when there is no due date", () => {
		expect(isTaskOverdue({ isCompleted: false, dueDate: null })).toBe(false);
	});

	it("returns false when the due date is in the future", () => {
		const futureDue = new Date();
		futureDue.setDate(futureDue.getDate() + 1);
		expect(isTaskOverdue({ isCompleted: false, dueDate: futureDue })).toBe(
			false,
		);
	});

	it("returns true when the due date is in the past and task is not completed", () => {
		const pastDue = new Date();
		pastDue.setDate(pastDue.getDate() - 1);
		expect(isTaskOverdue({ isCompleted: false, dueDate: pastDue })).toBe(true);
	});
});

describe("deriveTaskStatus", () => {
	it("returns 'Completed' when isCompleted is true, regardless of due date", () => {
		expect(
			deriveTaskStatus({
				isCompleted: true,
				status: "In Progress",
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("Completed");
	});

	it("returns the stored status when not overdue", () => {
		expect(
			deriveTaskStatus({
				isCompleted: false,
				status: "Not Started",
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("Not Started");
	});

	it("returns 'Overdue' when the task is past due and not completed", () => {
		const pastDue = new Date();
		pastDue.setDate(pastDue.getDate() - 1);
		expect(
			deriveTaskStatus({
				isCompleted: false,
				status: "In Progress",
				dueDate: pastDue,
				statusOverriddenAt: null,
			}),
		).toBe("Overdue");
	});

	it("respects statusOverriddenAt after the due date has passed", () => {
		const pastDue = new Date("2026-08-01T00:00:00Z");
		const overrideDate = new Date("2026-08-02T00:00:00Z"); // User changed it *after* it lapsed

		expect(
			deriveTaskStatus({
				isCompleted: false,
				status: "In Progress", // User explicitly set this
				dueDate: pastDue,
				statusOverriddenAt: overrideDate,
			}),
		).toBe("In Progress");
	});

	it("ignores statusOverriddenAt if the override happened *before* the due date lapsed", () => {
		const pastDue = new Date("2026-08-05T00:00:00Z");
		const overrideDate = new Date("2026-08-01T00:00:00Z");

		expect(
			deriveTaskStatus({
				isCompleted: false,
				status: "In Progress",
				dueDate: pastDue,
				statusOverriddenAt: overrideDate,
			}),
		).toBe("Overdue");
	});
});

describe("toStatusBucket", () => {
	it("maps standard statuses to their buckets", () => {
		expect(
			toStatusBucket({
				status: "Not Started",
				isCompleted: false,
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("notStarted");
		expect(
			toStatusBucket({
				status: "In Progress",
				isCompleted: false,
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("inProgress");
		expect(
			toStatusBucket({
				status: "In Progress",
				isCompleted: false,
				dueDate: new Date("2000-01-01"), // past due -> Overdue
				statusOverriddenAt: null,
			}),
		).toBe("overdue");
		expect(
			toStatusBucket({
				status: "Not Started",
				isCompleted: true, // completed -> Completed
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("completed");
	});

	it("maps unknown statuses to 'notStarted' by default", () => {
		expect(
			toStatusBucket({
				status: "Custom Status",
				isCompleted: false,
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("notStarted");
		expect(
			toStatusBucket({
				status: "",
				isCompleted: false,
				dueDate: null,
				statusOverriddenAt: null,
			}),
		).toBe("notStarted");
	});
});
