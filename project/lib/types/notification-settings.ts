import type { z } from "zod";
import type { notificationSettings } from "@/lib/db/schema";
import type { updateNotificationSettingsSchema } from "@/lib/validations/notification-settings-schema";

// DATABASE SCHEMA TYPES
export type DbNotificationSettings = typeof notificationSettings.$inferSelect;
export type NewDbNotificationSettings =
	typeof notificationSettings.$inferInsert;

// ZOD VALIDATION TYPES
export type NotificationSettingsPatch = z.infer<
	typeof updateNotificationSettingsSchema
>;

/**
 * notification setting key - strongly typed identifier for a setting toggle,
 * derived directly from the Zod patch schema to ensure compile-time
 * synchronization between UI toggles and database columns.
 */
export type NotificationSettingKey = keyof NotificationSettingsPatch;
