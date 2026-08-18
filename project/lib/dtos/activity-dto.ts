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

/**
 * One row in a history feed, ready to render.
 *
 * ActivityLogDTO carries actorId but no name, so a feed built from it could only
 * ever show a uuid. This shape is what the UI actually needs: who did it, what
 * they did, and when. The DAL joins Users once for the whole page rather than
 * letting each row look its own actor up.
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
 * One row in the notifications list.
 *
 * `actorName` is nullable because the actor column is: a notification can in
 * principle be raised by the system rather than a person, and the UI falls back
 * to a neutral label instead of rendering "null did something".
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
