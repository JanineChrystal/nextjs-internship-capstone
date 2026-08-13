import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { activityLogs, commentMentions, comments } from "@/lib/db/schema";

// 1. DATABASE SCHEMA VALIDATION (Generated from Drizzle)
export const insertActivityLogDbSchema = createInsertSchema(activityLogs);
export const selectActivityLogDbSchema = createSelectSchema(activityLogs);

export const insertCommentDbSchema = createInsertSchema(comments);
export const selectCommentDbSchema = createSelectSchema(comments);

export const insertCommentMentionDbSchema = createInsertSchema(commentMentions);
export const selectCommentMentionDbSchema = createSelectSchema(commentMentions);
