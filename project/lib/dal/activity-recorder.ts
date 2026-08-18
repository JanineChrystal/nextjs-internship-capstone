import "server-only";
import { db } from "@/lib/db";
import { activityLogs, notifications } from "@/lib/db/schema";
import type { NewDbActivityLog } from "@/lib/types/activity";

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
): Promise<void> {
	try {
		await db.insert(activityLogs).values({
			workspaceId: params.workspaceId,
			actorId: params.actorId,
			actionType: params.actionType,
			details: params.details,
			projectId: params.projectId ?? null,
			taskId: params.taskId ?? null,
			targetUserId: params.targetUserId ?? null,
		});

		// The actor-vs-recipient rule, applied once for every event type.
		const recipients = (params.notify ?? []).filter(
			(recipient) => recipient.recipientId !== params.actorId,
		);

		if (recipients.length === 0) return;

		await db.insert(notifications).values(
			recipients.map((recipient) => ({
				recipientId: recipient.recipientId,
				actorId: params.actorId,
				workspaceId: params.workspaceId,
				projectId: params.projectId ?? null,
				taskId: params.taskId ?? null,
				actionType: params.actionType,
				message: recipient.message,
			})),
		);
	} catch (error) {
		// Logged, not rethrown - see the contract above.
		console.error("recordActivity failed (mutation itself was unaffected):", {
			actionType: params.actionType,
			projectId: params.projectId,
			error,
		});
	}
}
