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
