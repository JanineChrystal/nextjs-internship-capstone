import type { z } from "zod";
import type { GridTask } from "@/lib/types/task";
import { parseTaskDate } from "@/lib/utils/date";

interface DateRangeFields {
	startDate?: string | null;
	dueDate?: string | null;
}

function parse(value: string | null | undefined): Date | null {
	if (!value || value === "--") return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday(): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

/**
 * Shared scheduling rules for anything with a start/due pair (projects, tasks):
 *
 * - the due date may never fall before the start date (time-of-day included), and
 * - when `enforceNotPast` is set, neither date may be scheduled before today.
 *
 * `enforceNotPast` is deliberately opt-in: it belongs on creation, but applying
 * it to edits would block legitimately updating something that already started
 * in the past.
 */
export function addScheduleRules(
	data: DateRangeFields,
	ctx: z.RefinementCtx,
	{ enforceNotPast }: { enforceNotPast: boolean },
): void {
	const start = parse(data.startDate);
	const due = parse(data.dueDate);

	if (start && due && due.getTime() < start.getTime()) {
		ctx.addIssue({
			code: "custom",
			path: ["dueDate"],
			message: "Due date must be on or after the start date.",
		});
	}

	if (!enforceNotPast) return;

	const today = startOfToday();

	if (start && start.getTime() < today.getTime()) {
		ctx.addIssue({
			code: "custom",
			path: ["startDate"],
			message: "Start date cannot be earlier than today.",
		});
	}

	if (due && due.getTime() < today.getTime()) {
		ctx.addIssue({
			code: "custom",
			path: ["dueDate"],
			message: "Due date cannot be earlier than today.",
		});
	}
}

/**
 * Checks a task's schedule after a single-field edit.
 *
 * Task dates are saved field-by-field, so each edit has to be validated against
 * the merged result rather than the one field that changed - otherwise moving a
 * start date past an existing due date would pass, because nothing looked at the
 * due date.
 *
 * Returns an error message, or null when the schedule is valid. A returned
 * string rather than a thrown error because the caller shows it in a toast and
 * rolls back, which is flow control, not an exception.
 */
export function validateSchedule(
	merged: Partial<GridTask>,
	changed: Partial<GridTask>,
): string | null {
	const start = parseTaskDate(merged.startDate);
	const due = parseTaskDate(merged.dueDate);

	if (start && due && due.getTime() < start.getTime()) {
		return "Due date must be on or after the start date.";
	}

	// Only the date the user just picked is held to the not-in-the-past rule,
	// so an existing task that already started remains editable.
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (changed.startDate !== undefined) {
		const changedStart = parseTaskDate(changed.startDate);
		if (changedStart && changedStart.getTime() < today.getTime()) {
			return "Start date cannot be earlier than today.";
		}
	}

	if (changed.dueDate !== undefined) {
		const changedDue = parseTaskDate(changed.dueDate);
		if (changedDue && changedDue.getTime() < today.getTime()) {
			return "Due date cannot be earlier than today.";
		}
	}

	return null;
}
