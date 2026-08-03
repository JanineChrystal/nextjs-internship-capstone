import { z } from "zod";

export const projectSchema = z.object({
	id: z.uuid(),

	title: z.string().min(1, "Title is required"),
	description: z.string(),

	daysLeft: z.number().int().nonnegative(),
	membersCount: z.number().int().nonnegative(),
	tasksCount: z.number().int().nonnegative(),
	progress: z.number().min(0).max(100),

	status: z.enum(["active", "completed", "archived"]),
	priority: z.enum(["high", "low"]),

	isOwned: z.boolean(),
	isAssigned: z.boolean(),

	// To do: Add if db is finalize
	// createdAt: z.date(),
	// updatedAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;
