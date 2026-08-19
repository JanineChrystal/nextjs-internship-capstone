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
 * A user's own email preferences.
 *
 * Neither function takes a userId. That is the access control: there is exactly
 * one row a caller may read or write, and it is resolved from the session here
 * rather than accepted as an argument - so there is no parameter to tamper with
 * and no permission check that a future call site could forget to make.
 */

/**
 * Reads the caller's preferences, falling back to the defaults when no row
 * exists.
 *
 * A row is deliberately NOT created on read. Most users never open this page,
 * and writing a row of pure defaults for every signup would fill the table with
 * data that says nothing. `createNotificationDAL` already treats a missing row
 * as "everything on", so absence and an all-default row mean the same thing.
 */
export async function getNotificationSettingsDAL(): Promise<NotificationSettingsDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	return getUserNotificationSettingsForWorkerDAL(user.id);
}

/**
 * Reads a specific user's preferences, falling back to the defaults when no row exists.
 *
 * This function bypasses session-based access control and is meant ONLY for internal
 * system processes (like the email notification worker) that need to know another
 * user's preferences to decide whether to send them an email.
 */
export async function getUserNotificationSettingsForWorkerDAL(
	userId: string,
): Promise<NotificationSettingsDTO> {
	try {
		const [row] = await db
			.select()
			.from(notificationSettings)
			.where(
				and(
					eq(notificationSettings.userId, userId),
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
 * Applies a patch of changed toggles, creating the row on first write.
 *
 * An upsert rather than a read-then-write: two toggles flipped quickly would
 * otherwise race, with the second insert failing on the userId unique
 * constraint because the first had already created the row. Conflict targets
 * that constraint and merges instead.
 *
 * Only the keys present in the patch are written, so flipping one switch cannot
 * quietly reset the others to whatever the client last believed they were.
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
