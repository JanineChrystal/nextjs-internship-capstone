import type { DbActivityLog, DbNotification } from "@/lib/types/activity";

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
		details: log.details,
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
