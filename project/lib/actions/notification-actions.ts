"use server";

import { revalidatePath } from "next/cache";
import {
	countUnreadNotificationsDAL,
	deleteNotificationDAL,
	getUserNotificationsDAL,
	markAllNotificationsAsReadDAL,
	markNotificationAsReadDAL,
} from "@/lib/dal/activity";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { NotificationsPageResult } from "@/lib/types/activity";

/**
 * mark notification as read - updates a single notification,
 * relying on the DAL to enforce ownership and prevent unauthorized
 * modifications.
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
 * get user notifications - fetches subsequent pages of
 * notifications for infinite scrolling, as the initial load is
 * handled by the server component.
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

/**
 * get unread notification count - retrieves the unread count
 * directly as a number since failures are handled by the DAL and a
 * missing count requires no UI rollback.
 */
export async function getUnreadNotificationCountAction(): Promise<number> {
	return countUnreadNotificationsDAL();
}
