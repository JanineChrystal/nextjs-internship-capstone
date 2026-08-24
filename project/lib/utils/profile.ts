import type { ProfileTask } from "@/lib/types/profile";

/** profile helpers - pure functions kept out of the server-only DAL and the view so they can be tested. */

/** task status label - isCompleted wins over status, which the schema keeps deliberately independent of it. */
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

/** completion percentage - guards the zero case, reachable since the profile lists shared projects with no assigned tasks. */
export function completionPercentage(completed: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((completed / total) * 100);
}
