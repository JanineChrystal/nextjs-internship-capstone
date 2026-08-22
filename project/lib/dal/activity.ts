import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
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
 * Which email preference, if any, governs a given notification.
 *
 * Project and workspace invitations are both recorded as INVITE_SENT, so the
 * action type cannot tell them apart - but the row can, because only a
 * project-scoped invite carries a projectId. That is what makes them two
 * separate switches without a second enum value and a migration.
 *
 * null means no switch governs it, which the caller treats as do-not-send.
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
			// Deliberately null rather than emailCommentMentions. COMMENT_ADDED
			// covers two different events - a comment on a task you are assigned to,
			// and a mention - and only the second has a switch. The mention site
			// passes emailCommentMentions explicitly; the assignee notice has no
			// switch, so it must not borrow one.
			return null;
		default:
			// Overdue projects will map here once something checks a due date. The
			// column is already stored and editable; nothing raises the event yet.
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

		// An explicit key wins, including an explicit null. `undefined` is the only
		// value that means "you decide" - which is what lets a caller say "no
		// switch governs this" and have it respected rather than re-derived.
		const preferenceKey =
			explicitPreference !== undefined
				? explicitPreference
				: toEmailPreferenceKey(data);

		if (settings) {
			// An event with no preference governing it stays off rather than
			// defaulting on: the user has no switch for it, so sending anyway would
			// be mail they cannot stop.
			shouldSendEmail = preferenceKey ? settings[preferenceKey] : false;
		} else {
			// No row means the user has never changed anything, and every column
			// defaults to true - so a governed event sends and an ungoverned one
			// still does not, matching the branch above.
			shouldSendEmail = preferenceKey !== null;
		}

		return { notification: toNotificationDTO(result[0]), shouldSendEmail };
	} catch (error) {
		throw new Error("Failed to create notification", { cause: error });
	}
}

/**
 * The shared row shape for both history feeds, built from one joined query.
 *
 * Rows whose actor has since been deleted are dropped by the inner join rather
 * than rendered as an anonymous entry - an audit line nobody can be held to is
 * worse than no line.
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
 * Everything that has happened on a project, newest first.
 *
 * Gated by project role rather than by being signed in: this is the whole
 * history of a project, and reading it should require the same access as
 * opening the project itself.
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
 * The history of one task, for the Activity tab in the task modal.
 *
 * Takes projectId as well as taskId so authorisation can be resolved without a
 * second lookup, and verifies the task really belongs to that project - passing
 * a foreign taskId with a project you can see must not leak another task's
 * history.
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
 * One page of this user's notifications, newest first.
 *
 * Scoped to recipientId, which is the only tenancy rule notifications need: a
 * notification is addressed to exactly one person, so there is no project or
 * workspace check to make.
 *
 * The actor join is a LEFT join because actorId is nullable - a notification
 * raised by the system rather than a person still has to render.
 *
 * Paginated with the limit + 1 trick the comments query already uses: ask for
 * one row beyond the page and report whether it arrived. That answers "is there
 * more" without a second COUNT across the whole table, which would get slower
 * exactly as someone accumulates the notifications that make paging worthwhile.
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
 * Removes one notification from the recipient's list.
 *
 * A soft delete, and scoped to the signed-in recipient so someone else's id
 * simply matches nothing. Notifications are a personal inbox - dismissing one
 * is the reader's decision and affects nobody else, which is exactly why the
 * activity log has no equivalent: that is a shared audit trail.
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
