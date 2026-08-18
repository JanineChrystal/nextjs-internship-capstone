import type {
	activityLogs,
	commentMentions,
	comments,
	notifications,
} from "@/lib/db/schema";
import type { NotificationFeedItemDTO } from "@/lib/dtos/activity-dto";

//DATABASE SCHEMA TYPES
export type DbActivityLog = typeof activityLogs.$inferSelect;
export type NewDbActivityLog = typeof activityLogs.$inferInsert;

export type DbComment = typeof comments.$inferSelect;
export type NewDbComment = typeof comments.$inferInsert;

export type DbCommentMention = typeof commentMentions.$inferSelect;
export type NewDbCommentMention = typeof commentMentions.$inferInsert;

export type DbNotification = typeof notifications.$inferSelect;
export type NewDbNotification = typeof notifications.$inferInsert;

/**
 * One page of the notifications list.
 *
 * `hasMore` rather than a total count, matching how comments paginate: the query
 * asks for one row beyond the page and reports whether it came back, which
 * answers "is there a next page" without a second COUNT over the whole table.
 */
export interface NotificationsPageResult {
	notifications: NotificationFeedItemDTO[];
	hasMore: boolean;
}
