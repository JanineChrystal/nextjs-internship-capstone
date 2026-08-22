import "server-only";
import { createNotificationDAL } from "@/lib/dal/activity";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import type { NewDbActivityLog } from "@/lib/types/activity";
import type { NotificationSettingKey } from "@/lib/types/notification-settings";
import { encrypt } from "@/lib/utils/encryption";

/**
 * Who should be told about an event, and what they should read.
 *
 * A list rather than a single recipient because one event can concern several
 * people at once - a comment on a task with three assignees notifies all three
 * from a single call.
 */
export interface ActivityRecipient {
	recipientId: string;
	message: string;
	/**
	 * Which settings switch governs the email for this recipient.
	 *
	 * Omit it to let the action type decide, which is right for events where the
	 * type says everything - an invite is an invite. Set it explicitly where one
	 * action type covers several meanings: COMMENT_ADDED is both "someone
	 * commented on your task" and "you were mentioned", and only the second has a
	 * switch. Pass `null` to mean no switch governs this, which is not the same
	 * as omitting it: null suppresses the email rather than deriving one.
	 */
	emailPreference?: NotificationSettingKey | null;
}

/** One recipient who was notified, and whether they should also be emailed. */
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
 * Writes one activity row, plus one notification per person the event concerns.
 *
 * This is the single place the whole app records "something happened". Two
 * rules live here rather than at the eleven call sites, so no caller has to
 * remember either one:
 *
 *   1. The activity row is always written. It is the project's audit trail and
 *      does not depend on whether anyone gets notified.
 *   2. The actor never notifies themselves. Telling someone about a thing they
 *      just did is noise, and enforcing it centrally means a new call site
 *      cannot forget the rule.
 *
 * NEVER THROWS. Callers await it - so the rows exist before the response is
 * sent - but a failure here is swallowed rather than propagated, because
 * assigning a task and *logging* that you assigned a task are not equally
 * important. If the activity table is briefly unreachable the user's actual
 * mutation must still succeed; a failed audit write is not a reason to tell
 * someone "could not assign task". That is the trade-off: a lost history row is
 * accepted so a real action never fails for a bookkeeping reason.
 *
 * The alternative - a retry queue with a worker and a dead-letter table - is
 * real infrastructure for a problem that has not happened yet.
 */
export async function recordActivity(
	params: RecordActivityParams,
): Promise<RecordedNotification[]> {
	try {
		await db.insert(activityLogs).values({
			workspaceId: params.workspaceId,
			actorId: params.actorId,
			actionType: params.actionType,
			// Encrypted: a log line quotes what changed, e.g. the old and new task
			// name, so the feed carries real content rather than just an event type.
			details: encrypt(params.details),
			projectId: params.projectId ?? null,
			taskId: params.taskId ?? null,
			targetUserId: params.targetUserId ?? null,
		});

		// The actor-vs-recipient rule, applied once for every event type.
		const recipients = (params.notify ?? []).filter(
			(recipient) => recipient.recipientId !== params.actorId,
		);

		if (recipients.length === 0) return [];

		// One call per recipient rather than a single bulk insert, because
		// createNotificationDAL is where "does this person want an email about
		// this?" is answered - and that answer is per person, since it reads their
		// own settings row.
		//
		// The cost is N inserts plus N settings reads instead of one insert. Real
		// recipient counts here are one to five, so it is negligible, and it buys
		// the thing that was missing: exactly one implementation of the preference
		// rule. The bulk insert was faster and bypassed that rule entirely, which
		// is how a second copy of it ended up in the email sender.
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
						// Encrypted for the same reason as details: a mention
						// notification quotes the comment that triggered it.
						message: encrypt(recipient.message) ?? recipient.message,
					},
					recipient.emailPreference,
				);

				return { recipientId: recipient.recipientId, shouldSendEmail };
			}),
		);
	} catch (error) {
		// Logged, not rethrown - see the contract above.
		console.error("recordActivity failed (mutation itself was unaffected):", {
			actionType: params.actionType,
			projectId: params.projectId,
			error,
		});
		// An empty list, not a throw: callers read this to decide whether to send
		// email, and a failed audit write must not turn into a failed mutation.
		// Nobody is emailed about an event that was never recorded.
		return [];
	}
}
