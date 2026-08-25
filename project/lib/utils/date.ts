import { format } from "date-fns";

export function formatDate(dateStr: string | undefined | null) {
	if (!dateStr || dateStr === "--") return "--";
	try {
		return format(new Date(dateStr), "MM/dd/yyyy");
	} catch {
		return dateStr;
	}
}

/**
 * The placeholder an empty date field carries in the UI. Stored nowhere - the
 * database holds null - but the grid renders it so a cell is never blank.
 */
const EMPTY_DATE_PLACEHOLDER = "--";

/**
 * Strips the UI placeholder before a value is sent to the server.
 *
 * Without this the string "--" would reach the action and be parsed as a date,
 * which yields Invalid Date rather than the null the column expects.
 */
export function toApiDateInput(value: string | undefined): string | undefined {
	return value && value !== EMPTY_DATE_PLACEHOLDER ? value : undefined;
}

/**
 * Parses a stored date string, returning null for anything unusable.
 *
 * Returning null rather than an Invalid Date matters: Invalid Date is truthy and
 * every comparison against it is false, so a malformed value would silently pass
 * validation instead of being treated as absent.
 */
export function parseTaskDate(value: string | undefined): Date | null {
	if (!value || value === EMPTY_DATE_PLACEHOLDER) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The calendar day a timestamp falls on, as a stable key.
 *
 * Built from the LOCAL year/month/day rather than the ISO string, because
 * toISOString() is UTC: an event at 8am Manila time is 00:00 UTC the same day,
 * but one at 7am is the previous UTC day - so ISO keys would scatter a single
 * afternoon across two headings.
 */
function toLocalDayKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * "Today", "Yesterday", or a written date.
 *
 * Compared by calendar day rather than by elapsed hours: something from 11pm
 * last night is "Yesterday" at 1am even though it is two hours old, which is how
 * people actually read dates.
 */
export function toDayHeading(date: Date): string {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const target = new Date(date);
	target.setHours(0, 0, 0, 0);

	const daysApart = Math.round(
		(today.getTime() - target.getTime()) / MILLISECONDS_PER_DAY,
	);

	if (daysApart === 0) return "Today";
	if (daysApart === 1) return "Yesterday";

	return target.toLocaleDateString(undefined, {
		day: "numeric",
		month: "long",
		// The year is noise for anything recent and essential for anything older.
		year: target.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}

/**
 * Splits an already-sorted list into consecutive same-day runs.
 *
 * Relies on the caller's ordering instead of sorting again - the query already
 * returned these newest-first, and re-sorting here would silently mask a change
 * in that ordering rather than surfacing it.
 */
export function groupByDay<T extends { createdAt: Date | string }>(
	items: T[],
): Array<{ key: string; heading: string; items: T[] }> {
	const groups: Array<{ key: string; heading: string; items: T[] }> = [];

	for (const item of items) {
		const date = new Date(item.createdAt);
		const key = toLocalDayKey(date);
		const lastGroup = groups.at(-1);

		if (lastGroup?.key === key) {
			lastGroup.items.push(item);
			continue;
		}

		groups.push({ key, heading: toDayHeading(date), items: [item] });
	}

	return groups;
}
