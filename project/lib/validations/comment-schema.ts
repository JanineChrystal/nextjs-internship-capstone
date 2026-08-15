import { z } from "zod";

export const CreateCommentSchema = z.object({
	body: z.string().min(1, "Comment cannot be empty").trim(),
	parentId: z.string().optional(),
});

export const UpdateCommentSchema = z.object({
	body: z.string().min(1, "Comment cannot be empty").trim(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
