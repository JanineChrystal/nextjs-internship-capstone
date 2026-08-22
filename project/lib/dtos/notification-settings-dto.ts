import type { DbNotificationSettings } from "@/lib/types/notification-settings";

/**
 * The preferences the settings page renders.
 *
 * Deliberately omits `id`, `userId` and the soft-delete timestamp. The page has
 * no use for any of them, and the row id in particular is something the client
 * should never hold - the only row a user may write is their own, and the server
 * resolves that from the session rather than trusting an id sent back to it.
 */
export interface NotificationSettingsDTO {
	emailWorkspaceInvites: boolean;
	emailProjectInvites: boolean;
	emailCommentMentions: boolean;
	emailCommentViolations: boolean;
	emailProjectOverdue: boolean;
	emailTaskCompletions: boolean;
	emailProjectCompletions: boolean;
}

export function toNotificationSettingsDTO(
	row: DbNotificationSettings,
): NotificationSettingsDTO {
	return {
		emailWorkspaceInvites: row.emailWorkspaceInvites,
		emailProjectInvites: row.emailProjectInvites,
		emailCommentMentions: row.emailCommentMentions,
		emailCommentViolations: row.emailCommentViolations,
		emailProjectOverdue: row.emailProjectOverdue,
		emailTaskCompletions: row.emailTaskCompletions,
		emailProjectCompletions: row.emailProjectCompletions,
	};
}

/**
 * What a user who has never opened this page gets.
 *
 * Matches the column defaults in the schema exactly. It exists so the page can
 * render before a row is written - the row is only created when someone
 * actually changes something, which keeps a table of all-default rows from
 * being created for every signup.
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsDTO = {
	emailWorkspaceInvites: true,
	emailProjectInvites: true,
	emailCommentMentions: true,
	emailCommentViolations: true,
	emailProjectOverdue: true,
	emailTaskCompletions: true,
	emailProjectCompletions: true,
};
