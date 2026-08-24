/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { isItemOnDate } from "@/lib/utils/calendar";

describe("isItemOnDate", () => {
	it("returns true for a project matching the date by dueDate", () => {
		const project = { type: "project", dueDate: "2026-08-19T00:00:00.000Z" } as any;
		const targetDate = new Date("2026-08-19T00:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(true);
	});

	it("returns true for a task matching the date by date (startDate/dueDate combined)", () => {
		const task = { type: "task", date: "2026-08-19T00:00:00.000Z" } as any;
		const targetDate = new Date("2026-08-19T00:00:00.000Z");
		expect(isItemOnDate(task, targetDate)).toBe(true);
	});

	it("returns false for a project with no dueDate", () => {
		const project = {} as any;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	it("returns false for a task with date as '--'", () => {
		const task = { date: "--" } as any;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(task, targetDate)).toBe(false);
	});

	it("returns false when the date is off by one day", () => {
		const project = { dueDate: "2026-08-20T00:00:00.000Z" } as any;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});

	it("returns false for invalid date strings", () => {
		const project = { dueDate: "invalid-date" } as any;
		const targetDate = new Date("2026-08-19T10:00:00.000Z");
		expect(isItemOnDate(project, targetDate)).toBe(false);
	});
});

