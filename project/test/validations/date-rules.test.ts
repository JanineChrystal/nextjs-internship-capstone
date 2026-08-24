/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { addScheduleRules, validateSchedule } from "@/lib/validations/date-rules";

describe("addScheduleRules", () => {
	it("rejects due date before start date", () => {
		const ctx = { addIssue: vi.fn() };
		const data = {
			startDate: "2026-08-20T10:00:00Z",
			dueDate: "2026-08-19T10:00:00Z",
		};
		addScheduleRules(data, ctx as any, { enforceNotPast: false });
		expect(ctx.addIssue).toHaveBeenCalledWith(
			expect.objectContaining({ path: ["dueDate"] }),
		);
	});

	it("allows due date equal to start date", () => {
		const ctx = { addIssue: vi.fn() };
		const data = {
			startDate: "2026-08-20T10:00:00Z",
			dueDate: "2026-08-20T10:00:00Z",
		};
		addScheduleRules(data, ctx as any, { enforceNotPast: false });
		expect(ctx.addIssue).not.toHaveBeenCalled();
	});

	it("rejects past dates when enforceNotPast is true", () => {
		const ctx = { addIssue: vi.fn() };
		const past = new Date();
		past.setDate(past.getDate() - 1); // Yesterday

		const data = { startDate: past.toISOString() };
		addScheduleRules(data, ctx as any, { enforceNotPast: true });
		expect(ctx.addIssue).toHaveBeenCalledWith(
			expect.objectContaining({ path: ["startDate"] }),
		);
	});

	it("allows past dates when enforceNotPast is false", () => {
		const ctx = { addIssue: vi.fn() };
		const past = new Date();
		past.setDate(past.getDate() - 1); // Yesterday

		const data = { startDate: past.toISOString() };
		addScheduleRules(data, ctx as any, { enforceNotPast: false });
		expect(ctx.addIssue).not.toHaveBeenCalled();
	});
});

describe("validateSchedule", () => {
	it("returns error string if due date is before start date", () => {
		const merged = {
			startDate: "2026-08-20T10:00:00Z",
			dueDate: "2026-08-19T10:00:00Z",
		};
		expect(validateSchedule(merged, {})).toContain("after the start date");
	});

	it("returns error if newly picked start date is in the past", () => {
		const past = new Date();
		past.setDate(past.getDate() - 1);
		const changed = { startDate: past.toISOString() };
		const merged = { ...changed };
		expect(validateSchedule(merged, changed)).toContain("earlier than today");
	});

	it("allows existing past dates if they weren't just changed", () => {
		const past = new Date();
		past.setDate(past.getDate() - 1);
		const merged = { startDate: past.toISOString() };
		const changed = {}; // User didn't touch startDate
		expect(validateSchedule(merged, changed)).toBeNull();
	});

	it("returns null for a valid schedule", () => {
		const future = new Date();
		future.setDate(future.getDate() + 1);
		const merged = {
			startDate: future.toISOString(),
			dueDate: future.toISOString(),
		};
		const changed = { startDate: future.toISOString() };
		expect(validateSchedule(merged, changed)).toBeNull();
	});
});

