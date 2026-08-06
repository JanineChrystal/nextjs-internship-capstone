import type {
	TaskBoard,
	TaskPriority,
	TaskStatus,
	TaskTag,
} from "@/types/task";

export type IconName =
	| "clock"
	| "check-circle"
	| "circle"
	| "alert-triangle"
	| "chevrons-up"
	| "chevron-up"
	| "chevron-down";

export const STATUS_CONFIG: Record<
	TaskStatus,
	{ color: string; icon: IconName }
> = {
	"In Progress": {
		color: "text-primary bg-primary/10 border-primary/20",
		icon: "clock",
	},
	Completed: {
		color:
			"text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800/30",
		icon: "check-circle",
	},
	"Not Started": {
		color: "text-secondary bg-surface-container-high border-outline-variant/30",
		icon: "circle",
	},
};

export const PRIORITY_CONFIG: Record<
	TaskPriority,
	{ color: string; icon: IconName }
> = {
	Urgent: {
		color: "text-error",
		icon: "alert-triangle",
	},
	High: {
		color: "text-orange-600 dark:text-orange-400",
		icon: "chevrons-up",
	},
	Medium: {
		color: "text-amber-500",
		icon: "chevron-up",
	},
	Low: {
		color: "text-secondary",
		icon: "chevron-down",
	},
};

export const TAG_CONFIG: Record<TaskTag, string> = {
	Design:
		"text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
	Research: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
	Analytics:
		"text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30",
	Content:
		"text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
};

export const BOARD_CONFIG: Record<TaskBoard, string> = {
	"In Progress": "",
	Completed: "",
	"Up Next": "",
	Backlog: "",
};
