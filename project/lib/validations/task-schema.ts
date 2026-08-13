import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { attachments, checklists, taskAssignees, tasks } from "@/lib/db/schema";

//DATABASE SCHEMA VALIDATION
export const insertTaskDbSchema = createInsertSchema(tasks);
export const selectTaskDbSchema = createSelectSchema(tasks);

export const insertTaskAssigneeDbSchema = createInsertSchema(taskAssignees);
export const selectTaskAssigneeDbSchema = createSelectSchema(taskAssignees);

export const insertChecklistDbSchema = createInsertSchema(checklists);
export const selectChecklistDbSchema = createSelectSchema(checklists);

export const insertAttachmentDbSchema = createInsertSchema(attachments);
export const selectAttachmentDbSchema = createSelectSchema(attachments);

//UI VALIDATION SCHEMAS
export const TaskStatusEnum = z.string();
export const TaskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
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
	avatarUrl: z.string().url(),
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
	url: z.string().url(),
});

export const LinkSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string().url(),
});

export const TaskItemSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Task title is required"),
	priority: TaskPriorityEnum,
	columnId: z.string(),
	category: z.string(),
	comments: z.number().int().optional(),
	attachments: z.number().int().optional(),
	date: z.string().optional(),
	tasksCompleted: z.number().int().optional(),
	tasksTotal: z.number().int().optional(),
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
