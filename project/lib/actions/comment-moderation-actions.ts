"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	applyModerationVerdictDAL,
	getCommentsPendingProfanityCheckDAL,
	getFlaggedCommentsDAL,
	resolveFlaggedCommentDAL,
} from "@/lib/dal/comment-moderation";
import type { FlaggedCommentDTO } from "@/lib/dtos/comment-moderation-dto";
import { detectProfanity } from "@/lib/profanity";

export async function getFlaggedCommentsAction(projectId: string): Promise<{
	success: boolean;
	data?: FlaggedCommentDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		return { success: true, data: await getFlaggedCommentsDAL(projectId) };
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

export async function retryPendingProfanityChecksAction(
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const pendingComments =
			await getCommentsPendingProfanityCheckDAL(projectId);

		for (const comment of pendingComments) {
			const verdict = await detectProfanity(comment.body);

			if (verdict.failedDetectors && verdict.failedDetectors.length > 0) {
				continue; // Still failing, leave pendingProfanityCheck as true
			}

			await applyModerationVerdictDAL(
				comment.id,
				verdict.isFlagged,
				verdict.reason,
				true, // isRetry = true
			);
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true };
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
