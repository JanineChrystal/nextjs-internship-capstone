import { z } from "zod";

/**
 * The one definition of a valid group name, shared by the client form and the
 * server action.
 *
 * Sharing it is the point: the form gives instant feedback and the action still
 * re-validates, because a server action is a public HTTP endpoint and cannot
 * trust that the browser ran any check at all. One schema means the two can
 * never disagree about what "too long" means.
 */
export const GroupNameSchema = z
	.string()
	.trim()
	.min(1, "Group name is required")
	.max(80, "Group name must be 80 characters or fewer");

export const SaveGroupSchema = z.object({
	name: GroupNameSchema,
});

export type SaveGroupFormValues = z.infer<typeof SaveGroupSchema>;
