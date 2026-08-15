import { useParams } from "next/navigation";
import * as React from "react";
import {
	createCommentAction,
	deleteCommentAction,
	getCommentsAction,
} from "@/lib/actions/comment-actions";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";

export function useTaskComments(taskId: string | undefined, isOpen: boolean) {
	const params = useParams();
	const projectId = params?.id as string;

	// Local State
	const [comments, setComments] = React.useState<CommentOutputDTO[]>([]);
	const [newComment, setNewComment] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	// Handlers
	const handleSubmitComment = async () => {
		const body = newComment.trim();
		if (!body || !taskId || !projectId) return;

		setNewComment("");
		const result = await createCommentAction(taskId, projectId, body);
		if (result.success && result.data) {
			setComments((prev) => [...prev, result.data as CommentOutputDTO]);
		}
	};

	const handleDeleteComment = async (commentId: string) => {
		if (!projectId) return;
		const previousComments = comments;

		setComments((prev) => prev.filter((c) => c.id !== commentId));
		const result = await deleteCommentAction(commentId, projectId);
		if (!result.success) {
			setComments(previousComments);
		}
	};

	// Effects
	React.useEffect(() => {
		if (!isOpen || !taskId || !projectId) {
			setComments([]);
			return;
		}

		setIsLoading(true);
		getCommentsAction(taskId, projectId).then((result) => {
			if (result.success && result.data) setComments(result.data);
			setIsLoading(false);
		});
	}, [isOpen, taskId, projectId]);

	return {
		comments,
		isLoading,
		newComment,
		setNewComment,
		handleSubmitComment,
		handleDeleteComment,
	};
}
