import type { DbActivityLog, DbNotification } from "@/lib/types/activity";
import { decrypt } from "@/lib/utils/encryption";

export interface ActivityLogDTO {
	id: string;
	workspaceId: string;
	projectId: string | null;
	taskId: string | null;
	actorId: string;
	targetUserId: string | null;
	actionType: string;
	details: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function toActivityLogDTO(log: DbActivityLog): ActivityLogDTO {
	return {
		id: log.id,
		workspaceId: log.workspaceId,
		projectId: log.projectId,
		taskId: log.taskId,
		actorId: log.actorId,
		targetUserId: log.targetUserId,
		actionType: log.actionType,
		details: decrypt(log.details),
		createdAt: log.createdAt,
		updatedAt: log.updatedAt,
	};
}

export interface NotificationDTO {
	id: string;
	recipientId: string;
	actorId: string | null;
	workspaceId: string | null;
	projectId: string | null;
	taskId: string | null;
	actionType: string;
	message: string;
	isRead: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function toNotificationDTO(
	notification: DbNotification,
): NotificationDTO {
	return {
		id: notification.id,
		recipientId: notification.recipientId,
		actorId: notification.actorId,
		workspaceId: notification.workspaceId,
		projectId: notification.projectId,
		taskId: notification.taskId,
		actionType: notification.actionType,
		message: notification.message,
		isRead: notification.isRead,
		createdAt: notification.createdAt,
		updatedAt: notification.updatedAt,
	};
}

/**
 * activity feed item dto - represents one row in a history feed, populated
 * with actor details to prevent the UI from displaying raw UUIDs, reducing
 * client-side lookups by joining user data at the DAL layer.
 */
export interface ActivityFeedItemDTO {
	id: string;
	actorName: string;
	actorAvatarUrl: string | null;
	actionType: string;
	details: string | null;
	projectId: string | null;
	taskId: string | null;
	createdAt: Date;
}

/**
 * notification feed item dto - represents one row in the notifications list,
 * using a nullable actorName to seamlessly support system-generated alerts
 * without rendering null-based strings.
 */
export interface NotificationFeedItemDTO {
	id: string;
	actorName: string | null;
	actorAvatarUrl: string | null;
	actionType: string;
	message: string;
	isRead: boolean;
	projectId: string | null;
	taskId: string | null;
	createdAt: Date;
}
