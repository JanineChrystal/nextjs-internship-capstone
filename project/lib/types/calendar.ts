import type { TaskItem } from "@/types/task";

// Project Deadline summary payload
export interface ProjectDeadlineItem {
	id: string;
	title: string;
	dueDate: string;
	// Carried so date filtering can match anywhere in the scheduled range,
	// not only on the final due date.
	startDate?: string;
	category?: string;
	priority?: "low" | "medium" | "high";
	type: "project";
}

// Wrap existing TaskItem to distinguish type
export interface TaskDeadlineItem extends TaskItem {
	type: "task";
	startDate?: string;
}

// Combined Discriminated Union
export type CalendarDeadlineItem = ProjectDeadlineItem | TaskDeadlineItem;
