import type { GridTask } from "@/types/task";

export const DEFAULT_TASK_DATA: Partial<GridTask> = {
	name: "",
	description: "",
	isCompleted: false,
	status: "Not Started",
	priority: "Medium",
	tag: "Design",
	board: "Backlog",
	startDate: "--",
	dueDate: "--",
	assignee: {
		name: "Unassigned",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Unassigned",
	},
	checklist: [],
	attachments: [],
	links: [],
};
