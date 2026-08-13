import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { activityLogs, notifications } from "@/lib/db/schema";
import {
	type ActivityLogDTO,
	type NotificationDTO,
	toActivityLogDTO,
	toNotificationDTO,
} from "@/lib/dtos/activity-dto";
import type { NewDbActivityLog, NewDbNotification } from "@/lib/types/activity";

export async function createActivityLogDAL(
	data: NewDbActivityLog,
): Promise<ActivityLogDTO> {
	try {
		const result = await db.insert(activityLogs).values(data).returning();
		return toActivityLogDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to create activity log", { cause: error });
	}
}

export async function createNotificationDAL(
	data: NewDbNotification,
): Promise<NotificationDTO> {
	try {
		const result = await db.insert(notifications).values(data).returning();
		return toNotificationDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to create notification", { cause: error });
	}
}

export async function getProjectActivityLogsDAL(
	projectId: string,
): Promise<ActivityLogDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(activityLogs)
			.where(
				and(
					eq(activityLogs.projectId, projectId),
					isNull(activityLogs.deletedAt),
				),
			)
			.orderBy(desc(activityLogs.createdAt));

		return results.map(toActivityLogDTO);
	} catch (error) {
		throw new Error("Failed to fetch activity logs", { cause: error });
	}
}

export async function getUserNotificationsDAL(): Promise<NotificationDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(notifications)
			.where(
				and(
					eq(notifications.recipientId, user.id),
					isNull(notifications.deletedAt),
				),
			)
			.orderBy(desc(notifications.createdAt));

		return results.map(toNotificationDTO);
	} catch (error) {
		throw new Error("Failed to fetch notifications", { cause: error });
	}
}

export async function markNotificationAsReadDAL(
	notificationId: string,
): Promise<NotificationDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(notifications)
			.set({ isRead: true, updatedAt: new Date() })
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.recipientId, user.id),
					isNull(notifications.deletedAt),
				),
			)
			.returning();

		if (!result.length)
			throw new Error("Notification not found or unauthorized");

		return toNotificationDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to mark notification as read", { cause: error });
	}
}
