/**
 * Calendar items are pinned to their DUE date only - they are deliberately not
 * drawn as a start-to-due span, which quickly turns into overlapping bars once
 * a month has more than a handful of items.
 *
 * When the due date carries a real time-of-day, the event is timed so Week/Day
 * views place it in that hour's row; a midnight due date means "no particular
 * time", so it stays in the all-day row instead of being falsely pinned to
 * 12:00 AM.
 */
export function toDueDateEventRange(dueDate: Date): {
	start: Date;
	end: Date;
	allDay: boolean;
} {
	const hasExplicitTime =
		dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0;

	if (!hasExplicitTime) {
		return { start: dueDate, end: dueDate, allDay: true };
	}

	// Timed events need a non-zero duration or they render with no height.
	const end = new Date(dueDate);
	end.setHours(end.getHours() + 1);

	return { start: dueDate, end, allDay: false };
}
