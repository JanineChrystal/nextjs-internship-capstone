import type { z } from "zod";
import type {
	AssigneeSchema,
	AttachmentSchema,
	ChecklistItemSchema,
	GridTaskSchema,
	LinkSchema,
	TaskBoardEnum,
	TaskPriorityEnum,
	TaskStatusEnum,
	TaskTagEnum,
} from "@/lib/validations/task-schema";

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

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type TaskTag = z.infer<typeof TaskTagEnum>;
export type TaskBoard = z.infer<typeof TaskBoardEnum>;
export type Assignee = z.infer<typeof AssigneeSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type TaskAttachment = z.infer<typeof AttachmentSchema>;
export type TaskLink = z.infer<typeof LinkSchema>;
export type GridTask = z.infer<typeof GridTaskSchema>;
