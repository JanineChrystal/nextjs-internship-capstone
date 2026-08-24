import type { TaskItem } from "@/lib/types/task";

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

/**
 * calendar event - defines the object structure rendered by react-big-calendar,
 * declared externally to avoid reverse dependency cycles where hooks would
 * otherwise import types from the components they feed.
 */
export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	resource?: unknown;
	extendedProps?: {
		priority?: string;
		type?: "project" | "task";
		category?: string;
		status?: string;
		[key: string]: unknown;
	};
}
