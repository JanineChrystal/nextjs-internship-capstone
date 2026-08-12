import { z } from "zod";

export const TaskStatusEnum = z.string();
export const TaskPriorityEnum = z.enum(["Urgent", "High", "Medium", "Low"]);
export const TaskTagEnum = z.enum([
	"Design",
	"Research",
	"Analytics",
	"Content",
]);
export const TaskBoardEnum = z.string();

export const TASK_STATUSES = ["In Progress", "Completed", "Not Started"];
export const TASK_PRIORITIES = TaskPriorityEnum.options;
export const TASK_TAGS = TaskTagEnum.options;
export const TASK_BOARDS = ["In Progress", "Completed", "Up Next", "Backlog"];

export const AssigneeSchema = z.object({
	name: z.string(),
	avatarUrl: z.url(),
	email: z.string().email().optional(),
});

export const ChecklistItemSchema = z.object({
	id: z.string(),
	title: z.string(),
	completed: z.boolean(),
});

export const AttachmentSchema = z.object({
	id: z.string(),
	name: z.string(),
	url: z.url(),
});

export const LinkSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.url(),
});

export const GridTaskSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	assignees: z.array(AssigneeSchema),
	startDate: z.string(),
	dueDate: z.string(),
	board: TaskBoardEnum,
	status: TaskStatusEnum,
	priority: TaskPriorityEnum,
	tag: TaskTagEnum,
	isCompleted: z.boolean(),
	checklist: z.array(ChecklistItemSchema).optional(),
	attachments: z.array(AttachmentSchema).optional(),
	links: z.array(LinkSchema).optional(),
});
