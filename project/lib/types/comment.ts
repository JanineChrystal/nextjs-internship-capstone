import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";

/**
 * comments page result - represents a paginated slice of a comment thread
 * using `hasMore` instead of total count since pagination occurs by root
 * comment, making a raw row count misleading.
 */
export interface CommentsPageResult {
	comments: CommentOutputDTO[];
	hasMore: boolean;
}

/**
 * create comment result - represents the outcome of a comment submission,
 * extending the standard success/error shape with fields for provisional
 * refusals (profanity checks) to maintain compatibility with existing callers.
 */
export interface CreateCommentResult {
	success: boolean;
	data?: CommentOutputDTO;
	error?: string;
	/** The word list matched and the author has not confirmed yet. Nothing was saved. */
	needsConfirmation?: boolean;
	/** Which detector matched, shown in the confirmation dialog. */
	warning?: string;
	/** The comment was saved AND flagged, so the author is told it is queued for review. */
	underReview?: boolean;
}

/**
 * pending profanity comment - represents a comment awaiting a background
 * profanity verdict, carrying author and task context since the result must
 * be delivered via notification if the composer is already closed.
 */
export interface PendingProfanityComment {
	id: string;
	body: string;
	authorId: string;
	authorEmail: string;
	taskId: string;
	taskName: string;
}

/**
 * retry profanity result - reports the outcome of a background retry operation
 * for pending profanity checks, including processed counts and remaining items.
 */
export interface RetryProfanityResult {
	success: boolean;
	error?: string;
	/** Comments this run reached a verdict on. */
	processed?: number;
	/** Still waiting afterwards, so the button can say whether to press again. */
	remaining?: number;
	/** Of the processed ones, how many turned out to be profane. */
	flagged?: number;
}
