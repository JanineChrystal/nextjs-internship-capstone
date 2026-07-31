import { z } from "zod";

export const projectSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1, "Title is required"),
	description: z.string(),
	daysLeft: z.number(),
	membersCount: z.number(),
	tasksCount: z.number(),
	progress: z.number().min(0).max(100),
	status: z.enum(["active", "completed", "archived"]),
});

export type Project = z.infer<typeof projectSchema>;
