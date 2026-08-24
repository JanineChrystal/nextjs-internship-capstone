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
 * notifications page result - represents one paginated slice of notifications
 * using `hasMore` rather than a total count to determine next-page presence
 * without requiring an expensive secondary COUNT query over the entire table.
 */
export interface NotificationsPageResult {
	notifications: NotificationFeedItemDTO[];
	hasMore: boolean;
}
