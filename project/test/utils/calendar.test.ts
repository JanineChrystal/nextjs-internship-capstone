import { describe, expect, it } from "vitest";
import type { CalendarDeadlineItem } from "@/lib/types/calendar";
import { isItemOnDate } from "@/lib/utils/calendar";

describe("isItemOnDate", () => {
	it("returns true for a project matching the date by dueDate", () => {
		const project = {
			type: "project",
			dueDate: "2026-08-19T00:00:00.000Z",
		} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T00:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(true);
	});

	it("returns true for a task matching the date by date (startDate/dueDate combined)", () => {
		const task = {
			type: "task",
			date: "2026-08-19T00:00:00.000Z",
		} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T00:00:00.000Z");
		expect(isItemOnDate(task, targetDate)).toBe(true);
	});

	it("returns false for a project with no dueDate", () => {
		const project = {} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	it("returns false for a task with date as '--'", () => {
		const task = { date: "--" } as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(task, targetDate)).toBe(false);
	});

	it("returns false when the date is off by one day", () => {
		const project = {
			dueDate: "2026-08-20T00:00:00.000Z",
		} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	it("returns false for invalid date strings", () => {
		const project = {
			dueDate: "invalid-date",
		} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	/** "--" sentinel - pins the contract rather than the branch, since new Date("--") is already Invalid and the explicit check is redundant. */
	it('treats the "--" sentinel as no date, for a project', () => {
		const project = {
			type: "project",
			dueDate: "--",
		} as unknown as CalendarDeadlineItem;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	it("matches the due date regardless of the time of day on it", () => {
		/** local components - isItemOnDate compares local date fields, so a UTC literal would pass or fail depending on the machine. */
		const dueInstant = new Date(2026, 7, 19, 23, 30);
		const project = {
			type: "project",
			dueDate: dueInstant.toISOString(),
		} as unknown as CalendarDeadlineItem;

		expect(isItemOnDate(project, new Date(2026, 7, 19, 0, 5))).toBe(true);
	});

	it("compares in the reader's local day, not in UTC", () => {
		/** local day boundary - switching this to a UTC comparison would shift every deadline for readers outside UTC. */
		const lateOnThe19th = new Date(2026, 7, 19, 23, 59);
		const project = {
			type: "project",
			dueDate: lateOnThe19th.toISOString(),
		} as unknown as CalendarDeadlineItem;

		expect(isItemOnDate(project, new Date(2026, 7, 19, 12, 0))).toBe(true);
		expect(isItemOnDate(project, new Date(2026, 7, 20, 12, 0))).toBe(false);
	});
});
