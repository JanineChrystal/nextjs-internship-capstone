export const TASK_STATUS_NOT_STARTED = "Not Started";
export const TASK_STATUS_IN_PROGRESS = "In Progress";
export const TASK_STATUS_COMPLETED = "Completed";
export const TASK_STATUS_OVERDUE = "Overdue";

/** The statuses a user may pick by hand. "Overdue" is applied by the system. */
export const SELECTABLE_TASK_STATUSES = [
	TASK_STATUS_NOT_STARTED,
	TASK_STATUS_IN_PROGRESS,
	TASK_STATUS_COMPLETED,
] as const;

interface TaskStatusInput {
	isCompleted: boolean;
	status: string;
	dueDate: Date | null;
	statusOverriddenAt: Date | null;
}

/**
 * True when the task has passed its due date without being completed.
 * Always computed - never stored - so it cannot drift out of date.
 */
export function isTaskOverdue(
	input: Pick<TaskStatusInput, "isCompleted" | "dueDate">,
): boolean {
	if (input.isCompleted || !input.dueDate) return false;
	return input.dueDate.getTime() < Date.now();
}

/**
 * The status shown to the user, combining the stored field with the computed
 * overdue condition.
 *
 * Completion always wins. Otherwise a lapsed due date promotes the status to
 * "Overdue" - unless the user has deliberately chosen a status *after* the
 * task lapsed, in which case their choice is respected. Comparing the override
 * timestamp against the due date (rather than just checking "was it ever
 * overridden") means that extending the due date and letting it lapse again
 * correctly re-promotes the task to Overdue.
 */
export function deriveTaskStatus(input: TaskStatusInput): string {
	if (input.isCompleted) return TASK_STATUS_COMPLETED;

	if (!isTaskOverdue(input)) return input.status;

	const overriddenSinceLapse =
		input.statusOverriddenAt !== null &&
		input.dueDate !== null &&
		input.statusOverriddenAt.getTime() >= input.dueDate.getTime();

	return overriddenSinceLapse ? input.status : TASK_STATUS_OVERDUE;
}

/**
 * The four buckets every status chart is built from.
 *
 * Safe object keys rather than the display strings, because the chart primitive
 * turns each series key into a CSS custom property (--color-<key>), and
 * "--color-Not Started" is not valid CSS.
 */
export type TaskStatusBucket =
	| "notStarted"
	| "inProgress"
	| "overdue"
	| "completed";

/**
 * Collapses a task's derived status into one of exactly four buckets.
 *
 * `status` is a free-text column, so besides the three selectable values it can
 * hold anything a previous version of the app wrote - "To Do" still exists in
 * older rows. Anything unrecognised folds into "Not Started", which is the
 * honest reading: the task has not been marked as started or finished.
 *
 * Fixing the bucket count at four is what lets the status palette be validated
 * once. A chart that grew a fifth series whenever someone typed a new status
 * could not have a colour set that was checked in advance.
 */
export function toStatusBucket(input: TaskStatusInput): TaskStatusBucket {
	const status = deriveTaskStatus(input);

	if (status === TASK_STATUS_COMPLETED) return "completed";
	if (status === TASK_STATUS_OVERDUE) return "overdue";
	if (status === TASK_STATUS_IN_PROGRESS) return "inProgress";
	return "notStarted";
}
