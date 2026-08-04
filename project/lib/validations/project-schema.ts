import { z } from "zod";

// 1. The Main Project Schema (Source of Truth)
export const projectSchema = z.object({
	id: z.string().uuid(), // Note: z.uuid() usually needs z.string().uuid()

	title: z.string().min(1, "Title is required"),
	description: z.string().optional(), // Made optional so users can leave it blank

	// NEW: Added fields from your Create Project UI
	category: z.string().min(1, "Category is required"),
	startDate: z.string().min(1, "Start date is required"),
	dueDate: z.string().min(1, "Due date is required"),

	// System / Calculated Fields
	daysLeft: z.number().int().nonnegative(),
	membersCount: z.number().int().nonnegative(),
	tasksCount: z.number().int().nonnegative(),
	progress: z.number().min(0).max(100),

	// Note: Adjusted slightly to match your UI options (planning instead of archived)
	status: z.enum(["active", "planning", "completed"]),
	priority: z.enum(["high", "low"]).default("high"),

	isOwned: z.boolean(),
	isAssigned: z.boolean(),

	// To do: Add if db is finalize
	// createdAt: z.date(),
	// updatedAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;

// 2. The Form Schema (Only what the user inputs!)
// We "pick" only the fields the user actually fills out in the modal
export const createProjectSchema = projectSchema.pick({
	title: true,
	category: true,
	startDate: true,
	dueDate: true,
	status: true,
	description: true,
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
