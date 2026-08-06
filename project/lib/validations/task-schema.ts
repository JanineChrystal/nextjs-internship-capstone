import { z } from "zod";

export const TaskStatusEnum = z.enum([
	"In Progress",
	"Completed",
	"Not Started",
]);
export const TaskPriorityEnum = z.enum(["Urgent", "High", "Medium", "Low"]);
export const TaskTagEnum = z.enum([
	"Design",
	"Research",
	"Analytics",
	"Content",
]);
export const TaskBoardEnum = z.enum([
	"In Progress",
	"Completed",
	"Up Next",
	"Backlog",
]);

export const TASK_STATUSES = TaskStatusEnum.options;
export const TASK_PRIORITIES = TaskPriorityEnum.options;
export const TASK_TAGS = TaskTagEnum.options;
export const TASK_BOARDS = TaskBoardEnum.options;

export const AssigneeSchema = z.object({
	name: z.string(),
	avatarUrl: z.string().url(),
});

export const GridTaskSchema = z.object({
	id: z.string(),
	name: z.string(),
	assignee: AssigneeSchema,
	startDate: z.string(),
	dueDate: z.string(),
	board: TaskBoardEnum,
	status: TaskStatusEnum,
	priority: TaskPriorityEnum,
	tag: TaskTagEnum,
	isCompleted: z.boolean(),
});
