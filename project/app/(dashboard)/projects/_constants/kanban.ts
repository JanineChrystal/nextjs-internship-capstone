import type { TaskItem } from "@/types/task";

export const columnsConfig = [
	{ id: "backlog", title: "Backlog", dotColor: "bg-secondary" },
	{ id: "up-next", title: "Up Next", dotColor: "bg-surface-tint" },
	{ id: "in-progress", title: "In Progress", dotColor: "bg-primary" },
];

export const initialTasks: TaskItem[] = [
	{
		id: "task-1",
		title: "Draft visual assets for Q3 social media push",
		priority: "medium",
		category: "Design",
		columnId: "backlog",
		comments: 2,
		attachments: 1,
	},
	{
		id: "task-2",
		title: "Review ad copy variations for landing page",
		priority: "medium",
		category: "Copy",
		columnId: "backlog",
		date: "Oct 12",
	},
	{
		id: "task-3",
		title: "Finalize budget allocation for Paid Search",
		priority: "urgent",
		category: "Urgent",
		columnId: "up-next",
	},
	{
		id: "task-4",
		title: "Build promotional landing page structure",
		priority: "high",
		category: "Development",
		columnId: "in-progress",
		tasksCompleted: 4,
		tasksTotal: 6,
	},
];
