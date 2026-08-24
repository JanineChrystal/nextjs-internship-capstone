import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { notificationSettings } from "@/lib/db/schema";
import {
	DEFAULT_NOTIFICATION_SETTINGS,
	type NotificationSettingsDTO,
	toNotificationSettingsDTO,
} from "@/lib/dtos/notification-settings-dto";
import type { NotificationSettingsPatch } from "@/lib/types/notification-settings";

/**
 * notification settings - manages a user's email preferences, strictly
 * scoping reads and writes to the active session rather than accepting
 * user IDs to inherently prevent cross-user access.
 */

/**
 * get notification settings - retrieves the caller's preferences, falling
 * back to defaults without creating a row to avoid filling the database
 * with redundant default entries.
 */
export async function getNotificationSettingsDAL(): Promise<NotificationSettingsDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [row] = await db
			.select()
			.from(notificationSettings)
			.where(
				and(
					eq(notificationSettings.userId, user.id),
					isNull(notificationSettings.deletedAt),
				),
			);

		return row
			? toNotificationSettingsDTO(row)
			: { ...DEFAULT_NOTIFICATION_SETTINGS };
	} catch (error) {
		throw new Error("Failed to fetch notification settings", { cause: error });
	}
}

/**
 * update notification settings - applies a patch to the user's settings
 * via a conflict-safe upsert, preventing race conditions and ensuring
 * unmodified toggles remain untouched.
 */
export async function updateNotificationSettingsDAL(
	patch: NotificationSettingsPatch,
): Promise<NotificationSettingsDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [row] = await db
			.insert(notificationSettings)
			.values({ userId: user.id, ...patch })
			.onConflictDoUpdate({
				target: notificationSettings.userId,
				set: { ...patch, updatedAt: new Date() },
			})
			.returning();

		return toNotificationSettingsDTO(row);
	} catch (error) {
		throw new Error("Failed to update notification settings", { cause: error });
	}
}
