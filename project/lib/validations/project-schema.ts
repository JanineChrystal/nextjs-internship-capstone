import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { projects } from "@/lib/db/schema";
import { addScheduleRules } from "./date-rules";

// DATABASE SCHEMA VALIDATION
export const insertProjectDbSchema = createInsertSchema(projects);
export const selectProjectDbSchema = createSelectSchema(projects);

export const ProjectCategorySchema = z.string().trim().optional();

// UI VALIDATION SCHEMAS
export const projectSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	category: ProjectCategorySchema,
	startDate: z.string().optional(),
	dueDate: z.string().optional(),
	daysLeft: z.number().int().nonnegative().optional(),
	membersCount: z.number().int().nonnegative().optional(),
	tasksCount: z.number().int().nonnegative().optional(),
	tasksCompleted: z.number().int().nonnegative().optional(),
	progress: z.number().min(0).max(100).optional(),
	status: z
		.enum(["active", "completed", "overdue", "archived"])
		.default("active")
		.optional(),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.default("low")
		.optional(),
	isOwned: z.boolean(),
	isAssigned: z.boolean(),
});

export type Project = z.infer<typeof projectSchema>;

const createProjectFields = projectSchema.pick({
	title: true,
	category: true,
	startDate: true,
	dueDate: true,
	status: true,
	description: true,
	priority: true,
});

export const createProjectSchema = createProjectFields.superRefine(
	(data, ctx) => addScheduleRules(data, ctx, { enforceNotPast: true }),
);

export type CreateProjectFormValues = z.infer<typeof createProjectFields>;

const editProjectFields = projectSchema
	.pick({
		title: true,
		description: true,
		status: true,
		category: true,
		startDate: true,
		dueDate: true,
		priority: true,
	})
	.partial();

// Editing skips the not-in-the-past rule so an already-running project stays
// editable, but the due-after-start rule still applies.
export const editProjectSchema = editProjectFields.superRefine((data, ctx) =>
	addScheduleRules(data, ctx, { enforceNotPast: false }),
);

export type EditProjectFormValues = z.infer<typeof editProjectFields>;
