import "server-only";
import { createNotificationDAL } from "@/lib/dal/activity";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import type { NewDbActivityLog } from "@/lib/types/activity";
import type { NotificationSettingKey } from "@/lib/types/notification-settings";
import { encrypt } from "@/lib/utils/encryption";

/**
 * activity recipient config - models an individual target for an
 * activity event notification, enabling multi-recipient broadcasting
 * from a single action.
 */
export interface ActivityRecipient {
	recipientId: string;
	message: string;
	/**
	 * email preference override - specifies the notification setting
	 * key to use, allowing explicit overrides (or null to suppress) for
	 * ambiguous action types like comments vs. mentions.
	 */
	emailPreference?: NotificationSettingKey | null;
}

/** recorded notification result - summarizes the notification outcome for a recipient, indicating if an email should also be dispatched. */
export interface RecordedNotification {
	recipientId: string;
	shouldSendEmail: boolean;
}

export interface RecordActivityParams {
	workspaceId: string;
	actorId: string;
	actionType: NewDbActivityLog["actionType"];
	details: string;
	projectId?: string | null;
	taskId?: string | null;
	targetUserId?: string | null;
	notify?: ActivityRecipient[];
}

/**
 * record activity - centralizes the creation of audit logs and
 * notifications, enforcing rules like excluding self-notifications.
 * It safely swallows errors to ensure that failed bookkeeping never
 * aborts the user's primary mutation.
 */
export async function recordActivity(
	params: RecordActivityParams,
): Promise<RecordedNotification[]> {
	try {
		await db.insert(activityLogs).values({
			workspaceId: params.workspaceId,
			actorId: params.actorId,
			actionType: params.actionType,
			/**
			 * encrypted details - encrypts the specific changes (like old
			 * and new names) to preserve privacy while keeping the audit
			 * feed informative.
			 */
			details: encrypt(params.details),
			projectId: params.projectId ?? null,
			taskId: params.taskId ?? null,
			targetUserId: params.targetUserId ?? null,
		});

		/** self notification exclusion - filters out the actor from the recipient list to prevent redundant self-notifications. */
		const recipients = (params.notify ?? []).filter(
			(recipient) => recipient.recipientId !== params.actorId,
		);

		if (recipients.length === 0) return [];

		/**
		 * individual recipient processing - iterates over recipients
		 * individually rather than bulk inserting to correctly resolve
		 * per-user notification preferences without duplicating the rules
		 * elsewhere.
		 */
		return await Promise.all(
			recipients.map(async (recipient) => {
				const { shouldSendEmail } = await createNotificationDAL(
					{
						recipientId: recipient.recipientId,
						actorId: params.actorId,
						workspaceId: params.workspaceId,
						projectId: params.projectId ?? null,
						taskId: params.taskId ?? null,
						actionType: params.actionType,
						/**
						 * encrypted message - encrypts the notification message
						 * to protect quoted user content like comments or
						 * mentions.
						 */
						message: encrypt(recipient.message) ?? recipient.message,
					},
					recipient.emailPreference,
				);

				return { recipientId: recipient.recipientId, shouldSendEmail };
			}),
		);
	} catch (error) {
		/** safe failure logging - logs the failure for debugging without interrupting the primary operation. */
		console.error("recordActivity failed (mutation itself was unaffected):", {
			actionType: params.actionType,
			projectId: params.projectId,
			error,
		});
		/**
		 * empty fallback return - returns an empty array on failure so
		 * dependent email dispatches correctly skip without failing the main
		 * mutation.
		 */
		return [];
	}
}
