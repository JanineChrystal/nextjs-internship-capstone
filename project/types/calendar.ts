import type { TaskItem } from "@/types/task";

// Project Deadline summary payload
export interface ProjectDeadlineItem {
	id: string;
	title: string;
	dueDate: string;
	category?: string;
	priority?: "low" | "medium" | "high";
	type: "project";
}

// Wrap existing TaskItem to distinguish type
export interface TaskDeadlineItem extends TaskItem {
	type: "task";
}

// Combined Discriminated Union
export type CalendarDeadlineItem = ProjectDeadlineItem | TaskDeadlineItem;
