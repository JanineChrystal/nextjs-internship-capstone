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
