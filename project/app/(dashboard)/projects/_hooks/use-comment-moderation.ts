"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getFlaggedCommentsAction,
	resolveFlaggedCommentAction,
	retryPendingProfanityChecksAction,
} from "@/lib/actions/comment-moderation-actions";
import type { FlaggedCommentDTO } from "@/lib/dtos/comment-moderation-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";

/** The flagged-comment queue for one project. */
export function useCommentModeration(projectId: string) {
	const [comments, setComments] = useState<FlaggedCommentDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	const load = useCallback(async () => {
		const result = await getFlaggedCommentsAction(projectId);
		if (result.success && result.data) setComments(result.data);
		setIsLoading(false);
	}, [projectId]);

	const resolve = useCallback(
		async (commentId: string, decision: "dismiss" | "delete") => {
			setBusyId(commentId);

			// Optimistic: the row leaves the queue immediately, and is put back if
			// the server refuses. Snapshot first so the rollback is exact.
			const snapshot = comments;
			setComments((current) =>
				current.filter((comment) => comment.commentId !== commentId),
			);

			const result = await resolveFlaggedCommentAction(
				commentId,
				projectId,
				decision,
			);
			setBusyId(null);

			if (!result.success) {
				setComments(snapshot);
				reportActionError("Could not update that comment", result.error);
				return;
			}

			reportActionSuccess(
				decision === "dismiss" ? "Flag dismissed" : "Comment deleted",
			);
		},
		[comments, projectId],
	);

	const [isRetrying, setIsRetrying] = useState(false);

	const retryPending = useCallback(async () => {
		setIsRetrying(true);
		const result = await retryPendingProfanityChecksAction(projectId);
		if (result.success) {
			reportActionSuccess("Retried pending checks");
			await load();
		} else {
			reportActionError("Could not retry", result.error);
		}
		setIsRetrying(false);
	}, [projectId, load]);

	useEffect(() => {
		load();
	}, [load]);

	return { comments, isLoading, busyId, resolve, retryPending, isRetrying };
}
