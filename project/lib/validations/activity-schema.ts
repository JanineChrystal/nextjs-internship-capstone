import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
	activityLogs,
	commentMentions,
	comments,
	notifications,
} from "@/lib/db/schema";

// DATABASE SCHEMA VALIDATION
export const insertActivityLogDbSchema = createInsertSchema(activityLogs);
export const selectActivityLogDbSchema = createSelectSchema(activityLogs);

export const insertCommentDbSchema = createInsertSchema(comments);
export const selectCommentDbSchema = createSelectSchema(comments);

export const insertCommentMentionDbSchema = createInsertSchema(commentMentions);
export const selectCommentMentionDbSchema = createSelectSchema(commentMentions);

export const insertNotificationDbSchema = createInsertSchema(notifications);
export const selectNotificationDbSchema = createSelectSchema(notifications);
