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

		// Both reads in one round trip. The queue and the pending count are two
		// halves of the same answer - how much moderation work is outstanding -
		// and fetching them separately would let the badge and the button disagree.
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
 * Re-examines comments whose original profanity check never completed.
 *
 * ## Why this is batched rather than a loop over everything
 *
 * The previous version awaited every pending comment in sequence inside the
 * request. Two things went wrong with that. A cold API answers in about 4.5
 * seconds, so a handful of comments ran past the serverless function's budget
 * and the request died half-finished. And the endpoint allows 30 requests per
 * minute per IP while each check costs two of them, so a long run started
 * collecting 429s - which fail open and leave those comments still pending, so
 * the next press hit the same wall at the same place and the queue never
 * drained.
 *
 * A fixed batch fixes both: PROFANITY_RETRY_BATCH_SIZE stays under the rate
 * limit with headroom for people posting comments meanwhile, and running the
 * batch together bounds the request at roughly one check rather than the sum of
 * all of them. What is left over is reported back, so pressing again is a
 * deliberate act with a visible number attached instead of a guess.
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

		// Together, not one after another. Every check is an independent HTTP call,
		// so the batch costs about as long as its slowest member.
		const outcomes = await Promise.all(
			batch.map(async (comment) => {
				const verdict = await detectProfanity(comment.body);

				// Still unreachable: leave it pending rather than recording a verdict
				// nobody actually reached.
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

		// This is the case the composer dialog cannot cover. When both detectors
		// answer in time the author is told on the spot; a verdict that arrives on
		// a retry finds them long gone, so it is delivered as a notification.
		//
		// Deferred to after(), like every other sender. Awaiting it here would add
		// up to ten activity writes and ten Resend calls to a request that the
		// batching above exists to keep short - undoing that work to deliver mail
		// the moderator is not waiting for.
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
 * Tells the authors of comments a retry has just flagged.
 *
 * Never throws. A notification that fails must not undo a verdict that has
 * already been written, and the moderator pressing the button is not the person
 * who needs to hear about a mail failure.
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
