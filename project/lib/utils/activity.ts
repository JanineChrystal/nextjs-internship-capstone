import type { DbTask } from "@/lib/types/task";

/**
 * The task fields worth describing in a history entry, and the label a user
 * should see for each.
 *
 * Deliberately excludes `boardId`. Moving a task between columns is "where it
 * sits", not "what it is" - and describing it honestly would mean turning a
 * uuid into a board name, which is a database lookup this sentence-builder has
 * no business owning. The kanban board already shows column position visually.
 *
 * Also excludes `notes`: a free-text body has no useful "from X to Y" form, and
 * quoting two paragraphs into an activity row would drown the feed.
 */
const TRACKED_TASK_FIELDS = {
	name: "name",
	category: "category",
	priority: "priority",
	status: "status",
	startDate: "start date",
	dueDate: "due date",
} as const;

type TrackedField = keyof typeof TRACKED_TASK_FIELDS;

/**
 * Renders one field value for a history sentence.
 *
 * Dates become plain calendar dates because the time component is noise in a
 * sentence a person reads, and an empty value becomes the word "none" rather
 * than a blank - "changed due date from none to Mar 3" reads correctly, while
 * "changed due date from  to Mar 3" looks like a bug.
 */
function formatValue(value: unknown): string {
	if (value === null || value === undefined || value === "") return "none";
	if (value instanceof Date) {
		return Number.isNaN(value.getTime())
			? "none"
			: value.toISOString().slice(0, 10);
	}
	return String(value);
}

/**
 * True when two values differ in a way worth telling a user about.
 *
 * Dates are compared by their timestamp, not by identity: two Date objects for
 * the same instant are never `!==`-equal, so a plain comparison would report a
 * change on every single save.
 */
function hasChanged(before: unknown, after: unknown): boolean {
	if (before instanceof Date || after instanceof Date) {
		const beforeTime = before instanceof Date ? before.getTime() : null;
		const afterTime = after instanceof Date ? after.getTime() : null;
		return beforeTime !== afterTime;
	}
	return (before ?? null) !== (after ?? null);
}

/**
 * One human sentence describing what actually changed on a task, or null when
 * nothing did.
 *
 * Returning null is what keeps a no-op save - opening a task and pressing save
 * without editing anything - from writing a meaningless history row. The caller
 * skips the activity write entirely when this is null, so "nothing changed"
 * costs one comparison rather than a database round trip.
 *
 * A pure function on purpose: no database, no session, no side effects. That is
 * why it lives in lib/utils rather than the DAL, and it is also what makes the
 * behaviour testable by passing two plain objects.
 */
export function describeTaskChanges(
	before: DbTask,
	after: DbTask,
): string | null {
	const parts: string[] = [];

	for (const field of Object.keys(TRACKED_TASK_FIELDS) as TrackedField[]) {
		if (!hasChanged(before[field], after[field])) continue;

		parts.push(
			`changed ${TRACKED_TASK_FIELDS[field]} from ${formatValue(before[field])} to ${formatValue(after[field])}`,
		);
	}

	if (parts.length === 0) return null;

	// Capitalised so the row reads as a sentence once a name is prefixed to it
	// in the UI: "User A changed category from Design to Research".
	const sentence = parts.join("; ");
	return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
