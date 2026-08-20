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

/** The flagged-comment queue for one project. */
export function useCommentModeration(projectId: string) {
	const [comments, setComments] = useState<FlaggedCommentDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);
	// Hook order per the house rules: all local state together, effects last.
	const [isRetrying, setIsRetrying] = useState(false);
	// Comments whose profanity check never completed. Distinct from the flagged
	// list - these are unjudged, not judged guilty - and without it there is no
	// way to tell that Filipino detection has been failing quietly for a week.
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

	/**
	 * Re-examines the pending batch.
	 *
	 * `silent` is for the automatic run on mount: a toast nobody asked for,
	 * appearing as a page finishes loading, reads as an error even when it says
	 * something reassuring. The section updating is feedback enough there. A
	 * deliberate press still reports what it did.
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

			// The old toast said "Retried pending checks" whether it had examined
			// forty comments or none, which made a stuck queue indistinguishable
			// from an empty one. The numbers are the whole point of the button.
			if (!silent) reportActionSuccess(describeRetry(result));
			await load();
		},
		[projectId, load],
	);

	useEffect(() => {
		load();
	}, [load]);

	/**
	 * Clears the backlog by itself when someone opens the section.
	 *
	 * A failed profanity check is a transient fault - the API was cold, or
	 * briefly rate-limited - and recovering from a transient fault should not
	 * depend on a person noticing a button and choosing to press it. If the
	 * service is healthy again, the backlog simply drains.
	 *
	 * The ref makes it once per mount. Without it, the retry updates the pending
	 * count, the count is a dependency, and the effect would run again forever.
	 *
	 * This is not a substitute for a scheduled job: it only runs when a moderator
	 * opens Project Settings. A project nobody visits keeps its backlog, and a
	 * cron is what would fix that properly.
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

/** Turns a retry result into one sentence a moderator can act on. */
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
