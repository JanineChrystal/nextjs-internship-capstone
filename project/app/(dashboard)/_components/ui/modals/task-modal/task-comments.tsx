"use client";

import { MessageSquare, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { useTaskComments } from "../../../../projects/_hooks/use-task-comments";

interface TaskCommentsProps {
	taskId: string | undefined;
	isOpen: boolean;
}

export function TaskComments({ taskId, isOpen }: TaskCommentsProps) {
	const {
		comments,
		isLoading,
		newComment,
		setNewComment,
		handleSubmitComment,
		handleDeleteComment,
	} = useTaskComments(taskId, isOpen);

	return (
		<div className="flex flex-col h-full bg-surface-container-lowest">
			<div className="px-4 py-4 pr-16 border-b border-outline-variant flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">Task Comments</h3>
				<MessageSquare className="h-4 w-4 text-secondary" />
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{isLoading && (
					<p className="text-sm text-secondary text-center">
						Loading comments...
					</p>
				)}
				{!isLoading && comments.length === 0 && (
					<p className="text-sm text-secondary text-center">No comments yet.</p>
				)}
				{comments.map((comment) => (
					<div key={comment.id} className="flex gap-3 group">
						<Image
							src={comment.authorAvatarUrl || "/placeholder.svg"}
							alt={comment.authorName}
							width={32}
							height={32}
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
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="h-5 w-5 opacity-0 group-hover:opacity-100 text-secondary hover:text-error hover:bg-error/10 ml-auto"
									onClick={() => handleDeleteComment(comment.id)}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
							<p className="text-sm text-on-surface">{comment.body}</p>
						</div>
					</div>
				))}
			</div>

			<div className="p-4 border-t border-outline-variant mt-auto">
				<div className="relative border border-outline-variant rounded-lg overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-primary/20 transition-all">
					<textarea
						placeholder="Write a comment..."
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
