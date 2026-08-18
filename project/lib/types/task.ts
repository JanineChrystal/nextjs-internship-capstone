import type { LucideIcon } from "lucide-react";
import type { z } from "zod";
import type {
	attachments,
	checklists,
	taskAssignees,
	tasks,
} from "@/lib/db/schema";
import type {
	AssigneeSchema,
	AttachmentSchema,
	ChecklistItemSchema,
	GridTaskSchema,
	LinkSchema,
	TaskBoardSchema,
	TaskCategorySchema,
	TaskItemSchema,
	TaskPrioritySchema,
	TaskStatusSchema,
} from "@/lib/validations/task-schema";

export type TaskItem = z.infer<typeof TaskItemSchema>;

export interface TaskModalAction {
	id: TaskModalActionId;
	label: string;
	icon: LucideIcon;
	className?: string;
	completedLabel?: string;
}

export interface TaskPropertyConfig {
	id: TaskPropertyId;
	label: string;
	options: readonly string[];
}

export type TaskModalActionId =
	| "TOGGLE_COMPLETION"
	| "DUPLICATE"
	| "ARCHIVE"
	| "DELETE";
export type TaskPropertyId = "category" | "status" | "priority" | "board";
export type PriorityType = "low" | "medium" | "high" | "urgent";

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskCategory = z.infer<typeof TaskCategorySchema>;
export type TaskBoard = z.infer<typeof TaskBoardSchema>;
export type Assignee = z.infer<typeof AssigneeSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type TaskAttachment = z.infer<typeof AttachmentSchema>;
export type TaskLink = z.infer<typeof LinkSchema>;
export type GridTask = z.infer<typeof GridTaskSchema>;

// DATABASE SCHEMA TYPES
export type DbTask = typeof tasks.$inferSelect;
export type NewDbTask = typeof tasks.$inferInsert;

export type DbTaskAssignee = typeof taskAssignees.$inferSelect;
export type NewDbTaskAssignee = typeof taskAssignees.$inferInsert;

export type DbChecklist = typeof checklists.$inferSelect;
export type NewDbChecklist = typeof checklists.$inferInsert;

export type DbAttachment = typeof attachments.$inferSelect;
export type NewDbAttachment = typeof attachments.$inferInsert;

/**
 * What the create-task form sends to the server.
 *
 * Lives here rather than in the action file because client components build this
 * object before calling the action, and a client must never import from a module
 * whose other exports are server-only.
 */
export interface CreateTaskInput {
	name: string;
	category?: string;
	status?: string;
	priority?: "low" | "medium" | "high" | "urgent";
	notes?: string;
	startDate?: string;
	dueDate?: string;
}
