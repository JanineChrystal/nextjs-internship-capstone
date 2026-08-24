import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { db } from "@/lib/db";
import {
	activityLogs,
	notificationSettings,
	notifications,
	tasks,
	users,
} from "@/lib/db/schema";
import {
	type ActivityFeedItemDTO,
	type ActivityLogDTO,
	type NotificationDTO,
	toActivityLogDTO,
	toNotificationDTO,
} from "@/lib/dtos/activity-dto";
import { toMemberName } from "@/lib/dtos/project-member-dto";
import type {
	NewDbActivityLog,
	NewDbNotification,
	NotificationsPageResult,
} from "@/lib/types/activity";
import type { NotificationSettingKey } from "@/lib/types/notification-settings";

import { decrypt } from "@/lib/utils/encryption";

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

/**
 * resolve email preference key - determines the appropriate notification
 * setting key for an event, using context like projectId to distinguish
 * overloaded action types (e.g. invites) without requiring new enum
 * values.
 */
function toEmailPreferenceKey(
	data: NewDbNotification,
): NotificationSettingKey | null {
	switch (data.actionType) {
		case "INVITE_SENT":
		case "PROJECT_MEMBER_ADDED":
			return data.projectId ? "emailProjectInvites" : "emailWorkspaceInvites";
		case "TASK_COMPLETED":
			return "emailTaskCompletions";
		case "PROJECT_COMPLETED":
			return "emailProjectCompletions";
		case "COMMENT_FLAGGED":
			return "emailCommentViolations";
		case "COMMENT_ADDED":
			/**
			 * comment preference override - returns null for comments to
			 * prevent generic assignee notices from falsely triggering the
			 * mention-specific email switch. Mentions will pass their
			 * preference explicitly.
			 */
			return null;
		default:
			/** overdue projects placeholder - future mapping for overdue project events once a check mechanism is implemented. */
			return null;
	}
}

export async function createNotificationDAL(
	data: NewDbNotification,
	explicitPreference?: NotificationSettingKey | null,
): Promise<{ notification: NotificationDTO; shouldSendEmail: boolean }> {
	try {
		const result = await db.insert(notifications).values(data).returning();

		let shouldSendEmail = false;

		const [settings] = await db
			.select()
			.from(notificationSettings)
			.where(
				and(
					eq(notificationSettings.userId, data.recipientId),
					isNull(notificationSettings.deletedAt),
				),
			);

		/**
		 * explicit preference handling - honors explicit keys or null
		 * overrides, falling back to derivation only when undefined,
		 * allowing callers to strictly enforce ungoverned events.
		 */
		const preferenceKey =
			explicitPreference !== undefined
				? explicitPreference
				: toEmailPreferenceKey(data);

		if (settings) {
			/**
			 * ungoverned event suppression - ensures events without a specific
			 * preference key default to off, preventing users from receiving
			 * unstoppable emails.
			 */
			shouldSendEmail = preferenceKey ? settings[preferenceKey] : false;
		} else {
			/**
			 * default notification state - assumes true for governed events
			 * if the user has no settings row, mirroring default database
			 * states while correctly suppressing ungoverned events.
			 */
			shouldSendEmail = preferenceKey !== null;
		}

		return { notification: toNotificationDTO(result[0]), shouldSendEmail };
	} catch (error) {
		throw new Error("Failed to create notification", { cause: error });
	}
}

/**
 * activity feed columns - defines a unified projection for activity
 * feeds, utilizing inner joins to intentionally drop audit lines
 * belonging to deleted actors rather than rendering anonymous entries.
 */
const activityFeedColumns = {
	id: activityLogs.id,
	actionType: activityLogs.actionType,
	details: activityLogs.details,
	projectId: activityLogs.projectId,
	taskId: activityLogs.taskId,
	createdAt: activityLogs.createdAt,
	firstName: users.firstName,
	lastName: users.lastName,
	email: users.email,
	imageUrl: users.imageUrl,
};

type ActivityFeedRow = {
	id: string;
	actionType: string;
	details: string | null;
	projectId: string | null;
	taskId: string | null;
	createdAt: Date;
	firstName: string | null;
	lastName: string | null;
	email: string;
	imageUrl: string | null;
};

function toActivityFeedItem(row: ActivityFeedRow): ActivityFeedItemDTO {
	return {
		id: row.id,
		actorName: toMemberName(row),
		actorAvatarUrl: row.imageUrl,
		actionType: row.actionType,
		details: decrypt(row.details),
		projectId: row.projectId,
		taskId: row.taskId,
		createdAt: row.createdAt,
	};
}

/**
 * get project activity logs - retrieves the entire activity history
 * for a project, strictly gated by project-level access rather than
 * simple authentication.
 */
export async function getProjectActivityLogsDAL(
	projectId: string,
): Promise<ActivityFeedItemDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const rows = await db
			.select(activityFeedColumns)
			.from(activityLogs)
			.innerJoin(users, eq(activityLogs.actorId, users.id))
			.where(
				and(
					eq(activityLogs.projectId, projectId),
					isNull(activityLogs.deletedAt),
				),
			)
			.orderBy(desc(activityLogs.createdAt));

		return rows.map(toActivityFeedItem);
	} catch (error) {
		throw new Error("Failed to fetch activity logs", { cause: error });
	}
}

/**
 * get task activity logs - retrieves the activity history for a
 * specific task, requiring projectId to validate task ownership and
 * prevent cross-project data leaks.
 */
export async function getTaskActivityLogsDAL(
	taskId: string,
	projectId: string,
): Promise<ActivityFeedItemDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const [task] = await db
			.select({ id: tasks.id })
			.from(tasks)
			.where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));

		if (!task) return [];

		const rows = await db
			.select(activityFeedColumns)
			.from(activityLogs)
			.innerJoin(users, eq(activityLogs.actorId, users.id))
			.where(
				and(eq(activityLogs.taskId, taskId), isNull(activityLogs.deletedAt)),
			)
			.orderBy(desc(activityLogs.createdAt));

		return rows.map(toActivityFeedItem);
	} catch (error) {
		throw new Error("Failed to fetch task activity", { cause: error });
	}
}

/**
 * This user's notifications, newest first.
 *
 * Scoped to recipientId, which is the only tenancy rule notifications need: a
 * notification is addressed to exactly one person, so there is no project or
 * workspace check to make.
 *
 * The actor join is a LEFT join because actorId is nullable - a notification
 * raised by the system rather than a person still has to render.
 */
/**
 * get user notifications - retrieves a paginated inbox of
 * notifications for the current user. It uses a limit+1 pagination
 * strategy to avoid expensive count queries and relies on LEFT joins
 * to accommodate system-generated events.
 */
export async function getUserNotificationsDAL(
	limit = 20,
	offset = 0,
): Promise<NotificationsPageResult> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const rows = await db
			.select({
				id: notifications.id,
				actionType: notifications.actionType,
				message: notifications.message,
				isRead: notifications.isRead,
				projectId: notifications.projectId,
				taskId: notifications.taskId,
				createdAt: notifications.createdAt,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				imageUrl: users.imageUrl,
			})
			.from(notifications)
			.leftJoin(users, eq(notifications.actorId, users.id))
			.where(
				and(
					eq(notifications.recipientId, user.id),
					isNull(notifications.deletedAt),
				),
			)
			.orderBy(desc(notifications.createdAt))
			.limit(limit + 1)
			.offset(offset);

		const hasMore = rows.length > limit;

		return {
			notifications: rows.slice(0, limit).map((row) => ({
				id: row.id,
				actorName: row.email
					? toMemberName({
							firstName: row.firstName,
							lastName: row.lastName,
							email: row.email,
						})
					: null,
				actorAvatarUrl: row.imageUrl,
				actionType: row.actionType,
				message: decrypt(row.message) ?? row.message,
				isRead: row.isRead,
				projectId: row.projectId,
				taskId: row.taskId,
				createdAt: row.createdAt,
			})),
			hasMore,
		};
	} catch (error) {
		throw new Error("Failed to fetch notifications", { cause: error });
	}
}

/**
 * delete notification - performs a soft delete of a notification,
 * strictly scoped to the recipient since the inbox is personal,
 * unlike the shared project activity log.
 */
export async function deleteNotificationDAL(
	notificationId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(notifications)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.recipientId, user.id),
					isNull(notifications.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to delete notification", { cause: error });
	}
}

/**
 * count unread notifications - executes an optimized count query for
 * the unread badge, returning 0 gracefully for signed-out users to
 * avoid breaking chrome layouts.
 */
export async function countUnreadNotificationsDAL(): Promise<number> {
	const user = await getCurrentUser();
	if (!user) return 0;

	try {
		const [row] = await db
			.select({ value: count() })
			.from(notifications)
			.where(
				and(
					eq(notifications.recipientId, user.id),
					eq(notifications.isRead, false),
					isNull(notifications.deletedAt),
				),
			);

		return row?.value ?? 0;
	} catch (error) {
		/**
		 * count error swallowing - swallows badge count errors to prevent
		 * minor query failures from bringing down the entire dashboard shell.
		 */
		console.error("countUnreadNotificationsDAL failed:", error);
		return 0;
	}
}

export async function markAllNotificationsAsReadDAL(): Promise<{
	updatedCount: number;
}> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const updated = await db
			.update(notifications)
			.set({ isRead: true, updatedAt: new Date() })
			.where(
				and(
					eq(notifications.recipientId, user.id),
					eq(notifications.isRead, false),
					isNull(notifications.deletedAt),
				),
			)
			.returning({ id: notifications.id });

		return { updatedCount: updated.length };
	} catch (error) {
		throw new Error("Failed to mark notifications as read", { cause: error });
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
