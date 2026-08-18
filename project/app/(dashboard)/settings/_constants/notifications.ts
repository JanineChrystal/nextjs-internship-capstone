import type { NotificationSettingKey } from "@/lib/types/notification-settings";

export interface NotificationToggleConfig {
	key: NotificationSettingKey;
	label: string;
	description: string;
	/**
	 * Shown under the description when the preference is stored and editable but
	 * nothing raises the event yet.
	 *
	 * This is here rather than only in a code comment on purpose. A switch that
	 * saves but never sends anything is indistinguishable from a broken one, and
	 * the person most likely to notice is the person demoing the app. Saying so
	 * on the page costs one line and removes the ambiguity entirely.
	 */
	pendingNote?: string;
}

/**
 * The email preferences the settings page offers, in display order.
 *
 * Config here, not inline in the component, so adding a preference is one entry
 * plus one column - and so this list can be diffed against the schema without
 * reading JSX.
 */
export const NOTIFICATION_TOGGLES: NotificationToggleConfig[] = [
	{
		key: "emailProjectInvites",
		label: "Project invites",
		description:
			"Someone adds you to a project, or invites you to one by email.",
	},
	{
		key: "emailWorkspaceInvites",
		label: "Workspace invites",
		description:
			"Someone adds you to their people directory without a specific project.",
	},
	{
		key: "emailCommentMentions",
		label: "Comment mentions",
		description: "Someone writes your name in a comment on a task.",
		pendingNote: "Starts sending once @ mentions ship in Phase 6.",
	},
	{
		key: "emailCommentViolations",
		label: "Comment violations",
		description:
			"A comment of yours is flagged by the language filter, or - if you own the project - someone else's is.",
		pendingNote: "Starts sending once comment moderation ships in Phase 6.",
	},
	{
		key: "emailProjectOverdue",
		label: "Project overdue",
		description: "A project you are part of passes its due date.",
		pendingNote:
			"Saved now, but nothing checks project due dates yet - no email will send until that check exists.",
	},
];

/** Every key the master switch flips together. */
export const ALL_NOTIFICATION_KEYS: NotificationSettingKey[] =
	NOTIFICATION_TOGGLES.map((toggle) => toggle.key);
