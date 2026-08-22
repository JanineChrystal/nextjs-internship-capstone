import { z } from "zod";

/**
 * The email preferences a user may change, as a partial patch.
 *
 * Every field is optional because the UI sends one toggle at a time rather than
 * the whole object. That matters for more than payload size: two browser tabs
 * open on this page would otherwise overwrite each other's unrelated toggles,
 * because each would post a full snapshot taken before the other's change.
 *
 * `.strict()` rejects any key not listed here, so a field the settings page has
 * no business writing - `userId`, `id`, `deletedAt` - cannot arrive from a
 * crafted request and be spread into an UPDATE.
 */
export const updateNotificationSettingsSchema = z
	.object({
		emailWorkspaceInvites: z.boolean(),
		emailProjectInvites: z.boolean(),
		emailCommentMentions: z.boolean(),
		emailCommentViolations: z.boolean(),
		emailProjectOverdue: z.boolean(),
		emailTaskCompletions: z.boolean(),
		emailProjectCompletions: z.boolean(),
	})
	.partial()
	.strict();
