import { CheckCircle, Copy, Trash2 } from "lucide-react";
import {
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
import type {
	GridTask,
	TaskModalAction,
	TaskPropertyConfig,
} from "@/types/task";

export const DEFAULT_TASK_DATA: Partial<GridTask> = {
	name: "",
	description: "",
	isCompleted: false,
	status: "Backlog",
	priority: "medium",
	tag: "Design",
	board: "Backlog",
	startDate: "--",
	dueDate: "--",
	assignees: [],
	checklist: [],
	attachments: [],
	links: [],
};

export const TASK_MODAL_ACTIONS: TaskModalAction[] = [
	{
		id: "TOGGLE_COMPLETION",
		label: "Mark as done",
		completedLabel: "Mark as not done",
		icon: CheckCircle,
		className: "text-green-600 dark:text-green-400",
	},
	{
		id: "DUPLICATE",
		label: "Duplicate task",
		icon: Copy,
	},
	{
		id: "DELETE",
		label: "Delete task",
		icon: Trash2,
		className:
			"text-error hover:text-error hover:bg-error/10 focus:text-error focus:bg-error/10",
	},
];

export const TASK_PROPERTIES_CONFIG: TaskPropertyConfig[] = [
	{ id: "tag", label: "Category", options: TASK_TAGS },
	{ id: "status", label: "Status", options: TASK_STATUSES },
	{ id: "priority", label: "Priority", options: TASK_PRIORITIES },
];

export const DATE_PICKER_CONFIG = [
	{ id: "startDate" as const, label: "Start Date" },
	{ id: "dueDate" as const, label: "Due Date" },
];
