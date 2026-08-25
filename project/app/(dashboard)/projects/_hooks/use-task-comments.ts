import { useParams } from "next/navigation";
import * as React from "react";
import {
	createCommentAction,
	deleteCommentAction,
	getCommentsAction,
} from "@/lib/actions/comment-actions";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { COMMENTS_PAGE_SIZE } from "../_constants/comments";

export function useTaskComments(taskId: string | undefined, isOpen: boolean) {
	const params = useParams();
	const projectId = params?.id as string;

	// Local State
	const [comments, setComments] = React.useState<CommentOutputDTO[]>([]);
	const [newComment, setNewComment] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [isLoadingMore, setIsLoadingMore] = React.useState(false);
	const [hasMore, setHasMore] = React.useState(false);
	const [replyingTo, setReplyingTo] = React.useState<{
		id: string;
		authorName: string;
	} | null>(null);

	// Set when a posted comment came back flagged, so the author is told once,
	// in a dialog they have to dismiss, rather than in a toast they may miss.
	const [underReviewNotice, setUnderReviewNotice] = React.useState(false);

	// Handlers
	const handleSubmitComment = async () => {
		const body = newComment.trim();
		if (!body || !taskId || !projectId) return;

		const parentId = replyingTo?.id;
		const replyContext = replyingTo;

		setNewComment("");
		setReplyingTo(null);

		const result = await createCommentAction(taskId, projectId, body, parentId);

		if (result.success && result.data) {
			setComments((prev) => [...prev, result.data as CommentOutputDTO]);

			// Flagged comments get a dialog rather than a toast. It is the one
			// outcome the author genuinely has to read, and a toast that fades after
			// four seconds is the wrong shape for "your comment is being reviewed".
			if (result.underReview) setUnderReviewNotice(true);
			else reportActionSuccess("Comment posted");
			return;
		}

		// The box was cleared optimistically before the request. Putting the text
		// back matters more than the toast does - losing what someone typed is the
		// worst possible outcome of a failed post.
		setNewComment(body);
		setReplyingTo(replyContext);
		reportActionError("Could not post comment", result.error);
	};

	const handleReply = (comment: CommentOutputDTO) => {
		setReplyingTo({ id: comment.id, authorName: comment.authorName });
	};

	const cancelReply = () => setReplyingTo(null);

	const handleDeleteComment = async (commentId: string) => {
		if (!projectId) return;
		const previousComments = comments;

		// Tombstone locally too, rather than removing, so any replies stay
		// attached to a visible (if redacted) parent.
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId ? { ...c, isDeleted: true, body: "" } : c,
			),
		);
		const result = await deleteCommentAction(commentId, projectId);
		if (!result.success) {
			setComments(previousComments);
			reportActionError("Could not delete comment", result.error);
		}
	};

	const loadMore = async () => {
		if (!taskId || !projectId || isLoadingMore) return;
		setIsLoadingMore(true);
		const result = await getCommentsAction(
			taskId,
			projectId,
			COMMENTS_PAGE_SIZE,
			comments.filter((c) => !c.parentId).length,
		);
		if (result.success && result.data) {
			setComments((prev) => {
				const existingIds = new Set(prev.map((c) => c.id));
				const merged = [
					...(result.data as CommentOutputDTO[]).filter(
						(c) => !existingIds.has(c.id),
					),
					...prev,
				];
				return merged.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				);
			});
			setHasMore(Boolean(result.hasMore));
		}
		setIsLoadingMore(false);
	};

	// Effects
	React.useEffect(() => {
		if (!isOpen || !taskId || !projectId) {
			setComments([]);
			setHasMore(false);
			setReplyingTo(null);
			return;
		}

		setIsLoading(true);
		getCommentsAction(taskId, projectId, COMMENTS_PAGE_SIZE, 0).then(
			(result) => {
				if (result.success && result.data) {
					setComments(result.data);
					setHasMore(Boolean(result.hasMore));
				}
				setIsLoading(false);
			},
		);
	}, [isOpen, taskId, projectId]);

	return {
		comments,
		isLoading,
		isLoadingMore,
		hasMore,
		loadMore,
		newComment,
		setNewComment,
		handleSubmitComment,
		handleDeleteComment,
		replyingTo,
		handleReply,
		cancelReply,
		underReviewNotice,
		dismissUnderReviewNotice: () => setUnderReviewNotice(false),
	};
}
