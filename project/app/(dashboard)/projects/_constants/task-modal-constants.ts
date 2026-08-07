import type { Assignee, GridTask } from "@/types/task";

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
	assignees: [],
	checklist: [],
	attachments: [],
	links: [],
};

export const PROJECT_MEMBERS: Assignee[] = [
	{
		name: "Sarah",
		email: "sarah@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
	},
	{
		name: "Mike",
		email: "mike@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
	},
	{
		name: "Alex",
		email: "alex@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
	},
	{
		name: "John",
		email: "john@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
	},
	{
		name: "Emily",
		email: "emily@example.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
	},
];
