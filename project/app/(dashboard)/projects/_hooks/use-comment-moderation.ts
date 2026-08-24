"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	getFlaggedCommentsAction,
	resolveFlaggedCommentAction,
	retryPendingProfanityChecksAction,
} from "@/lib/actions/comment-moderation-actions";
import type { FlaggedCommentDTO } from "@/lib/dtos/comment-moderation-dto";
import type { RetryProfanityResult } from "@/lib/types/comment";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";

/** comment moderation hook - manages the flagged-comment queue for a specific project. */
export function useCommentModeration(projectId: string) {
	const [comments, setComments] = useState<FlaggedCommentDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);
	// hook organization - groups local state declarations together before effects according to internal conventions.
	const [isRetrying, setIsRetrying] = useState(false);
	// pending checks counter - tracks comments awaiting profanity checks to explicitly monitor potential API failures or delays.
	const [pendingCount, setPendingCount] = useState(0);
	const hasAutoRetried = useRef(false);

	const load = useCallback(async () => {
		const result = await getFlaggedCommentsAction(projectId);
		if (result.success && result.data) setComments(result.data);
		if (result.success) setPendingCount(result.pendingCount ?? 0);
		setIsLoading(false);
	}, [projectId]);

	const resolve = useCallback(
		async (commentId: string, decision: "dismiss" | "delete") => {
			setBusyId(commentId);

			// optimistic queue update - removes the resolved comment instantly and rolls back if the server mutation fails.
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

	/**
	 * retry pending batch - attempts to re-evaluate pending comments, with a
	 * silent mode for automatic background retries on mount to avoid unexpected
	 * toast notifications.
	 */
	const retryPending = useCallback(
		async (silent = false) => {
			setIsRetrying(true);
			const result = await retryPendingProfanityChecksAction(projectId);
			setIsRetrying(false);

			if (!result.success) {
				if (!silent) reportActionError("Could not retry", result.error);
				return;
			}

			// descriptive result toast - provides specific counts of examined and flagged comments for clearer operational feedback.
			if (!silent) reportActionSuccess(describeRetry(result));
			await load();
		},
		[projectId, load],
	);

	useEffect(() => {
		load();
	}, [load]);

	/**
	 * automatic backlog retry - silently attempts to drain transiently failed
	 * profanity checks once when a moderator opens the settings, serving as a
	 * fallback mechanism in the absence of a background cron job.
	 */
	useEffect(() => {
		if (isLoading || pendingCount === 0 || hasAutoRetried.current) return;
		hasAutoRetried.current = true;
		void retryPending(true);
	}, [isLoading, pendingCount, retryPending]);

	return {
		comments,
		isLoading,
		busyId,
		resolve,
		retryPending,
		isRetrying,
		pendingCount,
	};
}

/** retry result formatter - converts retry outcomes into an actionable summary sentence. */
function describeRetry(result: RetryProfanityResult): string {
	const processed = result.processed ?? 0;
	const remaining = result.remaining ?? 0;

	if (processed === 0) {
		return remaining > 0
			? `No checks completed - the filter is still unreachable. ${remaining} pending.`
			: "Nothing was waiting to be checked.";
	}

	const flagged = result.flagged ?? 0;
	const checked = `Checked ${processed} comment${processed === 1 ? "" : "s"}`;
	const found = flagged > 0 ? `, ${flagged} flagged` : ", none flagged";
	const left = remaining > 0 ? `. ${remaining} still pending.` : ".";

	return checked + found + left;
}
