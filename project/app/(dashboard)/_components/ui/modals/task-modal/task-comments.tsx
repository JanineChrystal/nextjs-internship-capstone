"use client";

import { Send, ShieldAlert, Trash2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/buttons/button";
import { MentionText } from "@/components/ui/mention-text";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import { toMentionHandle } from "@/lib/utils/mentions";
import { COMMENT_MODERATION_DIALOG } from "../../../../projects/_constants/comments";
import { useMentionAutocomplete } from "../../../../projects/_hooks/use-mention-autocomplete";
import { useTaskComments } from "../../../../projects/_hooks/use-task-comments";
import { MemberAvatarChip } from "../../avatars/member-avatar-chip";
import { WarningModal } from "../warning-modal";

interface TaskCommentsProps {
	taskId: string | undefined;
	isOpen: boolean;
}

function CommentRow({
	comment,
	isReply,
	onReply,
	onDelete,
	mentionMembers,
}: {
	comment: CommentOutputDTO;
	isReply: boolean;
	onReply: (comment: CommentOutputDTO) => void;
	onDelete: (id: string) => void;
	mentionMembers: Map<string, { userId: string; label: string }>;
}) {
	// Replying to or deleting a comment only makes sense while its text is
	// actually present - a withheld or removed comment has nothing to act on.
	const isActionable =
		!comment.isDeleted && !comment.isUnderReview && !comment.isRejected;

	return (
		<div className="flex gap-3 group">
			<MemberAvatarChip
				name={comment.authorName}
				avatarUrl={comment.authorAvatarUrl}
				size={isReply ? "sm" : "md"}
			/>
			<div className="flex-1 min-w-0">
				<div className="rounded-lg bg-surface-container-high px-3 py-2 min-w-0">
					<p className="text-sm font-medium text-foreground truncate">
						{comment.authorName}
					</p>
					{comment.isRejected ? (
						// Says what happened without saying who did it. The moderator's
						// identity is on the row for the audit trail, but publishing it
						// back into the thread would turn a moderation decision into a
						// confrontation between two members.
						<span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-xs text-error italic">
							<ShieldAlert className="h-3.5 w-3.5 shrink-0" />
							This comment was rejected
						</span>
					) : comment.isDeleted ? (
						<p className="text-sm text-secondary italic">
							{comment.authorName} deleted a comment
						</p>
					) : comment.isUnderReview ? (
						// A pill rather than the text. The comment exists and its author
						// is still named - hiding that would make the thread lie about
						// what happened - but the words wait for a moderator.
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 text-xs text-secondary italic">
							<ShieldAlert className="h-3.5 w-3.5 shrink-0" />
							This comment is under review
						</span>
					) : (
						// overflow-wrap:anywhere (rather than break-word) so a single
						// very long unbroken string also shrinks this flex item's
						// min-content width instead of widening the whole panel.
						<p className="text-sm text-on-surface wrap-anywhere">
							<MentionText body={comment.body} members={mentionMembers} />
						</p>
					)}
				</div>
				<div className="flex items-center gap-3 mt-1 px-1 text-xs text-secondary">
					{isActionable && !isReply && (
						<button
							type="button"
							className="font-medium hover:text-primary"
							onClick={() => onReply(comment)}
						>
							Reply
						</button>
					)}
					<span>{new Date(comment.createdAt).toLocaleString()}</span>
					{isActionable && (
						<button
							type="button"
							className="ml-auto opacity-0 group-hover:opacity-100 hover:text-error transition-opacity"
							onClick={() => onDelete(comment.id)}
							aria-label="Delete comment"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					)}
				</div>
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
		underReviewNotice,
		dismissUnderReviewNotice,
	} = useTaskComments(taskId, isOpen);

	const params = useParams();
	const projectId = params?.id as string | undefined;

	const mentions = useMentionAutocomplete(projectId, newComment, setNewComment);

	// handle -> member, for turning "@janine" back into a display name. Built
	// from the same member list the suggestions come from, so what is rendered
	// and what is offered can never disagree.
	const mentionMembers = useMemo(
		() =>
			new Map(
				mentions.allMembers.map((member) => [
					toMentionHandle(member.email),
					{ userId: member.userId, label: member.name },
				]),
			),
		[mentions.allMembers],
	);

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
		<div className="flex flex-col h-full min-h-0">
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
				{rootComments.map((comment) => {
					const replies = repliesByParent.get(comment.id) ?? [];
					return (
						<div key={comment.id}>
							<CommentRow
								comment={comment}
								isReply={false}
								onReply={handleReply}
								onDelete={handleDeleteComment}
								mentionMembers={mentionMembers}
							/>
							{replies.length > 0 && (
								<div className="relative ml-4.5 pl-8 mt-3 space-y-3 border-l border-outline-variant">
									{replies.map((reply) => (
										<div key={reply.id} className="relative">
											<div className="absolute -left-8 top-3.5 w-8 border-t border-outline-variant" />
											<CommentRow
												comment={reply}
												isReply
												onReply={handleReply}
												onDelete={handleDeleteComment}
												mentionMembers={mentionMembers}
											/>
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
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
					{/* The suggestion list sits ABOVE the box: the composer is at the
					    bottom of a scrolling panel, so a dropdown below it would open
					    off-screen. */}
					{mentions.isOpen && (
						<ul className="absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg">
							{mentions.suggestions.map((member, index) => (
								<li key={member.userId}>
									<button
										type="button"
										onMouseMove={() => mentions.setActiveIndex(index)}
										onClick={() => mentions.select(member)}
										className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
											index === mentions.activeIndex
												? "bg-primary/10"
												: "hover:bg-surface-container"
										}`}
									>
										<MemberAvatarChip
											name={member.name}
											avatarUrl={member.avatarUrl}
											size="sm"
										/>
										<span className="min-w-0 flex-1 truncate text-on-surface">
											{member.name}
										</span>
										<span className="shrink-0 text-xs text-secondary">
											@{member.email.split("@")[0]}
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
					<textarea
						ref={mentions.inputRef}
						placeholder={
							replyingTo
								? `Reply to ${replyingTo.authorName}...`
								: "Write a comment... use @ to mention someone"
						}
						value={newComment}
						onChange={(e) => {
							setNewComment(e.target.value);
							mentions.syncCaret(e.currentTarget);
						}}
						onClick={(e) => mentions.syncCaret(e.currentTarget)}
						onKeyUp={(e) => mentions.syncCaret(e.currentTarget)}
						onKeyDown={(e) => {
							// The suggestion list gets first refusal on the keys it
							// uses, so Enter accepts a mention instead of posting a
							// half-typed comment.
							if (mentions.handleKeyDown(e)) return;
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

			{/* Reports what already happened, so there is nothing to cancel. The
			    same dialog covers English and Filipino hits, because both verdicts
			    are now in hand before the response is sent. */}
			<WarningModal
				isOpen={underReviewNotice}
				onClose={dismissUnderReviewNotice}
				onConfirm={dismissUnderReviewNotice}
				variant="info"
				hideCancel
				title={COMMENT_MODERATION_DIALOG.title}
				message={COMMENT_MODERATION_DIALOG.message}
				confirmText={COMMENT_MODERATION_DIALOG.confirmText}
			/>
		</div>
	);
}
