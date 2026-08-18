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
 * The identifier the settings UI uses for one toggle.
 *
 * Derived from the patch type rather than written out again, so a column that is
 * added to the schema but forgotten in the UI config is a compile error rather
 * than a switch that silently never appears.
 */
export type NotificationSettingKey = keyof NotificationSettingsPatch;
