"use client";

import { MessageSquare, Reply, Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import { useTaskComments } from "../../../../projects/_hooks/use-task-comments";

interface TaskCommentsProps {
	taskId: string | undefined;
	isOpen: boolean;
}

function CommentRow({
	comment,
	isReply,
	onReply,
	onDelete,
}: {
	comment: CommentOutputDTO;
	isReply: boolean;
	onReply: (comment: CommentOutputDTO) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<div className={`flex gap-3 group ${isReply ? "ml-10 mt-3" : ""}`}>
			<Image
				src={comment.authorAvatarUrl || "/placeholder.svg"}
				alt={comment.authorName}
				width={isReply ? 24 : 32}
				height={isReply ? 24 : 32}
				className="rounded-full bg-surface-variant shrink-0"
			/>
			<div className="flex-1 space-y-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">
						{comment.authorName}
					</span>
					<span className="text-xs text-secondary">
						{new Date(comment.createdAt).toLocaleString()}
					</span>
					{!comment.isDeleted && (
						<div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="h-5 w-5 text-secondary hover:text-primary"
								onClick={() => onReply(comment)}
								aria-label="Reply"
							>
								<Reply className="h-3 w-3" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="h-5 w-5 text-secondary hover:text-error hover:bg-error/10"
								onClick={() => onDelete(comment.id)}
								aria-label="Delete comment"
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>
				{comment.isDeleted ? (
					<p className="text-sm text-secondary italic">
						{comment.authorName} deleted a comment
					</p>
				) : (
					<p className="text-sm text-on-surface">{comment.body}</p>
				)}
			</div>
		</div>
	);
}

export function TaskComments({ taskId, isOpen }: TaskCommentsProps) {
	const {
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
	} = useTaskComments(taskId, isOpen);

	const rootComments = comments.filter((c) => !c.parentId);
	const repliesByParent = new Map<string, CommentOutputDTO[]>();
	for (const c of comments) {
		if (c.parentId) {
			const list = repliesByParent.get(c.parentId) ?? [];
			list.push(c);
			repliesByParent.set(c.parentId, list);
		}
	}

	return (
		<div className="flex flex-col h-full min-h-0 bg-surface-container-lowest">
			<div className="px-4 py-4 pr-16 border-b border-outline-variant flex items-center justify-between shrink-0">
				<h3 className="text-sm font-semibold text-foreground">Task Comments</h3>
				<MessageSquare className="h-4 w-4 text-secondary" />
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
				{hasMore && (
					<div className="flex justify-center">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={loadMore}
							disabled={isLoadingMore}
						>
							{isLoadingMore ? "Loading..." : "Load more"}
						</Button>
					</div>
				)}
				{isLoading && (
					<p className="text-sm text-secondary text-center">
						Loading comments...
					</p>
				)}
				{!isLoading && comments.length === 0 && (
					<p className="text-sm text-secondary text-center">No comments yet.</p>
				)}
				{rootComments.map((comment) => (
					<div key={comment.id}>
						<CommentRow
							comment={comment}
							isReply={false}
							onReply={handleReply}
							onDelete={handleDeleteComment}
						/>
						{(repliesByParent.get(comment.id) ?? []).map((reply) => (
							<CommentRow
								key={reply.id}
								comment={reply}
								isReply
								onReply={handleReply}
								onDelete={handleDeleteComment}
							/>
						))}
					</div>
				))}
			</div>

			<div className="p-4 border-t border-outline-variant mt-auto shrink-0">
				{replyingTo && (
					<div className="flex items-center justify-between mb-2 px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">
						<span>Replying to {replyingTo.authorName}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="h-4 w-4"
							onClick={cancelReply}
							aria-label="Cancel reply"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				)}
				<div className="relative border border-outline-variant rounded-lg overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-primary/20 transition-all">
					<textarea
						placeholder={
							replyingTo
								? `Reply to ${replyingTo.authorName}...`
								: "Write a comment..."
						}
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmitComment();
							}
						}}
						className="w-full min-h-20 p-3 text-sm bg-transparent border-none focus:outline-none resize-y pb-12"
					/>
					<div className="absolute bottom-2 right-2">
						<Button
							type="button"
							size="icon-sm"
							className="h-8 w-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
							onClick={handleSubmitComment}
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
