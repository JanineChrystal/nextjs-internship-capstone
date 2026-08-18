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
