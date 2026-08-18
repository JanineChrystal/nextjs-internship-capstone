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
 * What react-big-calendar renders. Declared here rather than inside
 * big-calendar.tsx because two hooks build these objects, and a hook importing a
 * type out of the component it feeds points the dependency arrow backwards.
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
