"use server";

import { revalidatePath } from "next/cache";
import {
	deleteNotificationDAL,
	getUserNotificationsDAL,
	markAllNotificationsAsReadDAL,
	markNotificationAsReadDAL,
} from "@/lib/dal/activity";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { NotificationsPageResult } from "@/lib/types/activity";

/**
 * Marks one notification as read.
 *
 * The DAL scopes the update to the signed-in recipient, so passing someone
 * else's notification id updates nothing rather than succeeding quietly - the
 * ownership check lives with the query, not here.
 */
export async function markNotificationAsReadAction(
	notificationId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await markNotificationAsReadDAL(notificationId);
		revalidatePath("/notifications");
		return { success: true };
	} catch (error) {
		console.error("markNotificationAsReadAction error:", error);
		return { success: false, error: "Could not mark that as read" };
	}
}

export async function markAllNotificationsAsReadAction(): Promise<{
	success: boolean;
	updatedCount?: number;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const { updatedCount } = await markAllNotificationsAsReadDAL();
		revalidatePath("/notifications");
		return { success: true, updatedCount };
	} catch (error) {
		console.error("markAllNotificationsAsReadAction error:", error);
		return { success: false, error: "Could not mark all as read" };
	}
}

/**
 * The next page of notifications, for the load-more button.
 *
 * The first page comes from the server component, so this only ever runs for
 * page two onward - there is no fetch on mount.
 */
export async function getUserNotificationsAction(
	limit: number,
	offset: number,
): Promise<{
	success: boolean;
	data?: NotificationsPageResult;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const page = await getUserNotificationsDAL(limit, offset);
		return { success: true, data: page };
	} catch (error) {
		console.error("getUserNotificationsAction error:", error);
		return { success: false, error: "Could not load more notifications" };
	}
}

export async function deleteNotificationAction(
	notificationId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await deleteNotificationDAL(notificationId);
		revalidatePath("/notifications");
		return { success: true };
	} catch (error) {
		console.error("deleteNotificationAction error:", error);
		return { success: false, error: "Could not remove that notification" };
	}
}
