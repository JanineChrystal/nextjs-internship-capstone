import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";

/**
 * One page of a task's comment thread.
 *
 * `hasMore` rather than a total count: the query paginates by *root* comment and
 * always returns every reply belonging to the roots on that page, so a total row
 * count would not line up with what was actually sent and would make the "load
 * more" button lie.
 */
export interface CommentsPageResult {
	comments: CommentOutputDTO[];
	hasMore: boolean;
}

/**
 * What posting a comment can come back as.
 *
 * Three outcomes rather than the usual two, because a comment can now be
 * refused *provisionally*: the instant word list matched, so the author is
 * asked to confirm before anything is written. That is a different thing from
 * an error - nothing went wrong, and the same call repeated with
 * `acknowledgedWarning` will succeed.
 *
 * Modelled as fields on the existing `{ success, data, error }` shape rather
 * than a discriminated union, so the dozens of existing call sites that only
 * read `success` and `error` keep working untouched.
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
