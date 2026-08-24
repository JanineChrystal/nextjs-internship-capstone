"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CommentViolationEmail } from "@/app/(dashboard)/notifications/_components/email/comment-violation-email";
import { PROFANITY_RETRY_BATCH_SIZE } from "@/lib/constants/profanity";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
import {
	applyModerationVerdictDAL,
	countCommentsPendingProfanityCheckDAL,
	getCommentsPendingProfanityCheckDAL,
	getFlaggedCommentsDAL,
	resolveFlaggedCommentDAL,
} from "@/lib/dal/comment-moderation";
import type { FlaggedCommentDTO } from "@/lib/dtos/comment-moderation-dto";
import { sendNotification } from "@/lib/email/send-notification";
import { detectProfanity } from "@/lib/profanity";
import type {
	PendingProfanityComment,
	RetryProfanityResult,
} from "@/lib/types/comment";
import { getAppBaseUrl } from "@/lib/utils/app-url";

export async function getFlaggedCommentsAction(projectId: string): Promise<{
	success: boolean;
	data?: FlaggedCommentDTO[];
	pendingCount?: number;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		/**
		 * batched query execution - fetches both flagged comments and
		 * pending count concurrently to maintain state consistency across
		 * UI elements.
		 */
		const [data, pendingCount] = await Promise.all([
			getFlaggedCommentsDAL(projectId),
			countCommentsPendingProfanityCheckDAL(projectId),
		]);

		return { success: true, data, pendingCount };
	} catch (error) {
		console.error("getFlaggedCommentsAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error && error.message === "Unauthorized"
					? "You do not have permission to moderate this project"
					: "Could not load flagged comments",
		};
	}
}

export async function resolveFlaggedCommentAction(
	commentId: string,
	projectId: string,
	decision: "dismiss" | "delete",
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await resolveFlaggedCommentDAL(commentId, projectId, decision);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("resolveFlaggedCommentAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error && error.message === "Unauthorized"
					? "You do not have permission to moderate this project"
					: "Could not update that comment",
		};
	}
}

/**
 * profanity check retry batching - re-examines a fixed batch of pending comments concurrently to stay within rate limits and avoid serverless timeouts.
 */
export async function retryPendingProfanityChecksAction(
	projectId: string,
): Promise<RetryProfanityResult> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const batch = await getCommentsPendingProfanityCheckDAL(
			projectId,
			PROFANITY_RETRY_BATCH_SIZE,
		);

		if (batch.length === 0) {
			return { success: true, processed: 0, remaining: 0, flagged: 0 };
		}

		/**
		 * concurrent evaluation - executes independent profanity checks in
		 * parallel to minimize total latency.
		 */
		const outcomes = await Promise.all(
			batch.map(async (comment) => {
				const verdict = await detectProfanity(comment.body);

				/**
				 * preservation of pending state - retains pending status for checks
				 * that fail again rather than assuming a false negative.
				 */
				if (verdict.failedDetectors && verdict.failedDetectors.length > 0) {
					return { comment, settled: false, isFlagged: false, reason: null };
				}

				await applyModerationVerdictDAL(
					comment.id,
					verdict.isFlagged,
					verdict.reason,
					true,
				);

				return {
					comment,
					settled: true,
					isFlagged: verdict.isFlagged,
					reason: verdict.reason,
				};
			}),
		);

		const settled = outcomes.filter((outcome) => outcome.settled);
		const newlyFlagged = settled.filter((outcome) => outcome.isFlagged);

		/**
		 * deferred author notification - uses after() to notify authors of
		 * newly flagged comments asynchronously, keeping the moderation
		 * action fast.
		 */
		if (newlyFlagged.length > 0) {
			const toNotify = newlyFlagged.map((outcome) => ({
				comment: outcome.comment,
				reason: outcome.reason,
			}));
			after(() => notifyFlaggedAuthors(projectId, user.id, toNotify));
		}

		const remaining = await countCommentsPendingProfanityCheckDAL(projectId);

		revalidatePath(`/projects/${projectId}`);
		return {
			success: true,
			processed: settled.length,
			remaining,
			flagged: newlyFlagged.length,
		};
	} catch (error) {
		console.error("retryPendingProfanityChecksAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error && error.message === "Unauthorized"
					? "You do not have permission to moderate this project"
					: "Could not retry pending checks",
		};
	}
}

/**
 * notify flagged authors - asynchronously alerts authors of newly
 * flagged comments, swallowing errors to prevent undoing the
 * moderation verdict.
 */
async function notifyFlaggedAuthors(
	projectId: string,
	actorId: string,
	items: { comment: PendingProfanityComment; reason: string | null }[],
): Promise<void> {
	try {
		const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);

		for (const { comment, reason } of items) {
			const recorded = await recordActivity({
				workspaceId,
				actorId,
				actionType: "COMMENT_FLAGGED",
				details: "A comment was flagged by the language filter",
				projectId,
				taskId: comment.taskId,
				notify: [
					{
						recipientId: comment.authorId,
						message: "A comment of yours was flagged and is under review",
						emailPreference: "emailCommentViolations" as const,
					},
				],
			});

			await sendNotification({
				shouldSend: recorded.some(
					(entry) =>
						entry.recipientId === comment.authorId && entry.shouldSendEmail,
				),
				to: comment.authorEmail,
				subject: "A comment of yours is under review",
				template: CommentViolationEmail({
					taskName: comment.taskName,
					commentBody: comment.body,
					reason: reason ?? "Profanity",
					taskUrl: `${getAppBaseUrl()}/projects/${projectId}?task=${comment.taskId}`,
				}),
			});
		}
	} catch (error) {
		console.error("Failed to notify flagged comment authors:", error);
	}
}
