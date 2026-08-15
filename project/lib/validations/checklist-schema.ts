import { z } from "zod";

export const CreateChecklistItemSchema = z.object({
	// Allows an empty title: the UI adds a blank row that the user then
	// types into in place, so the row must exist server-side before typing starts.
	title: z.string().trim(),
});

export const UpdateChecklistItemSchema = z.object({
	title: z.string().min(1).trim().optional(),
	isCompleted: z.boolean().optional(),
});

export type CreateChecklistItemInput = z.infer<
	typeof CreateChecklistItemSchema
>;
export type UpdateChecklistItemInput = z.infer<
	typeof UpdateChecklistItemSchema
>;
