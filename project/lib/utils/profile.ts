import type { ProfileTask } from "@/lib/types/profile";

/**
 * profile presentation helpers - pure functions pulled out of the profile DAL
 * and view so they can be tested without a database or a render. Each one is a
 * small rule that is easy to get subtly wrong and impossible to notice by eye.
 */

/**
 * task status label - collapses the stored status into the three the profile
 * badge renders.
 *
 * `isCompleted` wins over `status` because it is the authoritative completion
 * flag: the schema keeps it deliberately independent of `status` and of which
 * board the task sits in, so reading `status` alone would call a finished task
 * "In Progress" whenever its text status was never updated.
 */
export function toProfileStatus(task: {
	isCompleted: boolean;
	status: string;
}): ProfileTask["status"] {
	if (task.isCompleted) return "Completed";
	return task.status === "Not Started" ? "To Do" : "In Progress";
}

/** initials - at most two letters, derived from the name rather than hard-coded. */
export function initialsOf(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

/**
 * completion percentage - guards the zero case, which became reachable once the
 * profile started listing shared projects the person has no tasks in. Dividing
 * there renders "NaN%".
 */
export function completionPercentage(completed: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((completed / total) * 100);
}
