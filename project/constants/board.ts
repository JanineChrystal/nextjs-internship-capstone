import type { BoardColumn } from "@/types/board";

export const defaultColumns: BoardColumn[] = [
	{ id: "backlog", title: "Backlog", dotColor: "bg-secondary", order: 0 },
	{ id: "to-do", title: "To Do", dotColor: "bg-surface-tint", order: 1 },
	{ id: "in-progress", title: "In Progress", dotColor: "bg-primary", order: 2 },
	{ id: "completed", title: "Completed", dotColor: "bg-success", order: 3 },
];
