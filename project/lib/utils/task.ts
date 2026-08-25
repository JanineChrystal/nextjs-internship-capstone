import type { GridTask } from "@/types/task";

export function hasIncompleteChecklist(task: GridTask | undefined): boolean {
	if (!task) return false;
	return Boolean(
		task.checklist?.length && task.checklist.some((item) => !item.completed),
	);
}
