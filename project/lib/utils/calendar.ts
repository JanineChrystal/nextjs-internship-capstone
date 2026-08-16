import type { CalendarDeadlineItem } from "@/lib/types/calendar";

function parseDateValue(value: string | undefined | null): Date | null {
	if (!value || value === "--") return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * True when the item's DUE date falls on `date`.
 *
 * Deliberately matches the due date only, mirroring how events are drawn on
 * the calendar - filtering across a start-to-due span would surface items on
 * days where nothing is actually shown.
 */
export function isItemOnDate(item: CalendarDeadlineItem, date: Date): boolean {
	const due =
		item.type === "project"
			? parseDateValue(item.dueDate)
			: parseDateValue(item.date);

	return due ? isSameDay(due, date) : false;
}
