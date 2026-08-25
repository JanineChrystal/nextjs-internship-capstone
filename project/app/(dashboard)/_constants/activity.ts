/**
 * unread poll interval - how often the sidebar re-counts unread notifications
 * while the reader sits on one page. Sixty seconds is a deliberate compromise:
 * the app has no realtime channel, and a shorter interval buys little for a
 * badge nobody is watching second by second.
 */
export const UNREAD_POLL_INTERVAL_MS = 60_000;

/**
 * A short label per event type, shown as a badge beside each history row.
 *
 * The `details` column already carries the readable sentence, so this exists
 * only to let someone scan a long feed for one kind of event without reading
 * every line. Keys mirror actionTypeEnum in the schema.
 */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
	TASK_CREATED: "Created",
	TASK_UPDATED: "Updated",
	TASK_ASSIGNED: "Assigned",
	TASK_COMPLETED: "Completed",
	COMMENT_ADDED: "Comment",
	BOARD_CREATED: "Board added",
	BOARD_DELETED: "Board removed",
	BOARD_REORDERED: "Board moved",
	PROJECT_MEMBER_ADDED: "Member added",
	PROJECT_MEMBER_REMOVED: "Member removed",
	WORKSPACE_MEMBER_REMOVED: "Directory",
	INVITE_SENT: "Invite sent",
	INVITE_ACCEPTED: "Invite accepted",
};

/**
 * An unrecognised type still has to render something, so the raw enum value is
 * softened rather than dropped: a new event type added to the schema shows as
 * "Task Reopened" instead of vanishing from the feed.
 */
export function toActivityLabel(actionType: string): string {
	return (
		ACTIVITY_TYPE_LABELS[actionType] ??
		actionType
			.toLowerCase()
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")
	);
}
