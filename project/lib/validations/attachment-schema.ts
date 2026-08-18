import { z } from "zod";

export const CreateAttachmentSchema = z.object({
	name: z.string().min(1, "Attachment name is required").trim(),
	url: z.string().url("A valid URL is required"),
	type: z.enum(["file", "link"]),
});

export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>;
