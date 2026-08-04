import { z } from "zod";

export const projectSchema = z.object({
	id: z.uuid(),

	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	category: z.string().min(1, "Category is required"),
	startDate: z.string().min(1, "Start date is required"),
	dueDate: z.string().min(1, "Due date is required"),
	daysLeft: z.number().int().nonnegative(),
	membersCount: z.number().int().nonnegative(),
	tasksCount: z.number().int().nonnegative(),
	progress: z.number().min(0).max(100),
	status: z.enum(["active", "planning", "completed"]),
	priority: z.enum(["high", "low"]).default("high"),

	isOwned: z.boolean(),
	isAssigned: z.boolean(),

	// To do: Add if db is finalize
	// createdAt: z.date(),
	// updatedAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;

// The Form Schema (Only what the user inputs)
export const createProjectSchema = projectSchema.pick({
	title: true,
	category: true,
	startDate: true,
	dueDate: true,
	status: true,
	description: true,
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const editProjectSchema = projectSchema.pick({
	title: true,
	description: true,
});

export type EditProjectFormValues = z.infer<typeof editProjectSchema>;
