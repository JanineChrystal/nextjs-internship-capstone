import type {
	activityLogs,
	commentMentions,
	comments,
	notifications,
} from "@/lib/db/schema";

//DATABASE SCHEMA TYPES
export type DbActivityLog = typeof activityLogs.$inferSelect;
export type NewDbActivityLog = typeof activityLogs.$inferInsert;

export type DbComment = typeof comments.$inferSelect;
export type NewDbComment = typeof comments.$inferInsert;

export type DbCommentMention = typeof commentMentions.$inferSelect;
export type NewDbCommentMention = typeof commentMentions.$inferInsert;

export type DbNotification = typeof notifications.$inferSelect;
export type NewDbNotification = typeof notifications.$inferInsert;
