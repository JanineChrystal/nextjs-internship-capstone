export type PriorityType = "low" | "medium" | "high" | "urgent";

export interface TaskItem {
	id: string;
	title: string;
	priority: PriorityType;
	columnId: string;
	category: string;
	comments?: number;
	attachments?: number;
	date?: string;
	tasksCompleted?: number;
	tasksTotal?: number;
}

export type TaskStatus = "In Progress" | "Completed" | "Not Started";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
export type TaskTag = "Design" | "Research" | "Analytics" | "Content";
export type TaskBoard = "In Progress" | "Completed" | "Up Next" | "Backlog";

export type GridTask = {
	id: string;
	name: string;
	assignee: { name: string; avatarUrl: string };
	startDate: string;
	dueDate: string;
	board: TaskBoard;
	status: TaskStatus;
	priority: TaskPriority;
	tag: TaskTag;
	isCompleted: boolean;
};
