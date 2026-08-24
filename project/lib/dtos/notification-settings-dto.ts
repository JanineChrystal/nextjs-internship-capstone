import type { DbNotificationSettings } from "@/lib/types/notification-settings";

/**
 * notification settings dto - shapes the preferences rendered by the settings
 * page, deliberately omitting internal IDs and timestamps that the client has
 * no use for, relying on server-side session resolution instead.
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
 * default notification settings - provides the fallback defaults mimicking
 * the schema for new users, preventing the creation of all-default rows
 * upon signup until explicit changes are made.
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
