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
export const TaskStatusSchema = z.string().min(1, "Status is required").trim();
export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const TaskBoardSchema = z
	.string()
	.min(1, "Board column is required")
	.trim();
export const TaskCategorySchema = z
	.string()
	.min(1, "Category cannot be empty")
	.trim()
	.optional();

export const DEFAULT_TASK_STATUSES = [
	"Not Started",
	"In Progress",
	"Completed",
];
export const TASK_PRIORITIES = TaskPrioritySchema.options;
export const DEFAULT_TASK_CATEGORIES = [
	"Design",
	"Research",
	"Analytics",
	"Content",
	"Development",
];
export const TASK_BOARDS = ["In Progress", "Completed", "Up Next", "Backlog"];

export const AssigneeSchema = z.object({
	userId: z.string(),
	name: z.string(),
	avatarUrl: z.string(),
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
	priority: TaskPrioritySchema,
	columnId: z.string(),
	category: TaskCategorySchema,
	comments: z.number().int().optional(),
	attachments: z.number().int().optional(),
	date: z.string().optional(),
	tasksCompleted: z.number().int().optional(),
	tasksTotal: z.number().int().optional(),
});

export const GridTaskSchema = z.object({
	id: z.string(),
	projectId: z.string().optional(),
	name: z.string(),
	notes: z.string().optional(),
	category: TaskCategorySchema,
	assignees: z.array(AssigneeSchema),
	startDate: z.string(),
	dueDate: z.string(),
	board: TaskBoardSchema,
	status: TaskStatusSchema,
	priority: TaskPrioritySchema,
	isCompleted: z.boolean(),
	checklist: z.array(ChecklistItemSchema).optional(),
	attachments: z.array(AttachmentSchema).optional(),
	links: z.array(LinkSchema).optional(),
});

export const updateTaskSchema = z.object({
	name: z.string().optional(),
	status: TaskStatusSchema.optional(),
	priority: TaskPrioritySchema.optional(),
	category: TaskCategorySchema.optional(),
	notes: z.string().optional(),
	dueDate: z.string().optional(),
	startDate: z.string().optional(),
	boardId: z.string().optional(),
	isCompleted: z.boolean().optional(),
});

export const bulkUpdateTaskStatusSchema = z.object({
	taskIds: z.array(z.string()),
	status: TaskStatusSchema,
	boardId: z.string().optional(),
	isCompleted: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
	taskId: z.string(),
	newBoardId: z.string(),
});
