"use client";

import { Check, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { SectionTitle } from "@/components/ui/sections";
import { GridTable } from "@/components/views/grid-table/grid-table";
import { useTaskStore } from "@/stores/use-task-store";
import {
	COMMENT_MODERATION_COLUMNS,
	settingsSectionTexts,
} from "../../../_constants/settings-view";
import { useCommentModeration } from "../../../_hooks/use-comment-moderation";

interface CommentModerationSectionProps {
	projectId: string;
}

export function CommentModerationSection({
	projectId,
}: CommentModerationSectionProps) {
	const openTask = useTaskStore((state) => state.openTaskModal);
	const {
		comments,
		isLoading,
		busyId,
		resolve,
		retryPending,
		isRetrying,
		pendingCount,
	} = useCommentModeration(projectId);

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<SectionTitle
				title={
					<>
						{settingsSectionTexts.commentModeration.title}
						{comments.length > 0 && (
							<span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full font-bold">
								{comments.length}
							</span>
						)}
					</>
				}
				description={settingsSectionTexts.commentModeration.description}
			/>

			{/* Absent entirely when nothing is pending, rather than present and
			    disabled. This control exists to report a fault; on a healthy project
			    a permanently greyed "No Pending Checks" is a broken-looking button
			    advertising a problem that does not exist. */}
			{pendingCount > 0 && (
				<div className="flex items-center justify-end gap-3 -mt-2">
					<p className="text-xs text-secondary">
						{pendingCount} comment{pendingCount === 1 ? "" : "s"} could not be
						checked and {pendingCount === 1 ? "is" : "are"} awaiting a retry.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => retryPending()}
						disabled={isRetrying}
					>
						{isRetrying ? "Retrying..." : `Retry Now (${pendingCount})`}
					</Button>
				</div>
			)}

			<GridTable
				data={comments}
				columns={COMMENT_MODERATION_COLUMNS}
				keyExtractor={(comment) => comment.commentId}
				renderEmptyState={() => (
					<div className="flex flex-col items-center justify-center py-10 border-t border-dashed border-outline-variant bg-surface-container-lowest">
						<ShieldAlert size={48} className="text-secondary/50 mb-4" />
						<h3 className="text-lg font-semibold text-on-surface">
							{isLoading ? "Loading..." : "No flagged comments"}
						</h3>
						<p className="text-sm text-secondary">
							{isLoading
								? "Checking the review queue."
								: "Nothing is waiting for review."}
						</p>
					</div>
				)}
				renderRow={(comment) => (
					<>
						<div className="w-52">
							{/* min-w-0 on the flex child is what actually lets truncate
							    work here - without it the span refuses to shrink below
							    its content and spills into the comment column. */}
							<div className="flex items-center gap-2 min-w-0">
								<MemberAvatar
									name={comment.authorName}
									avatarUrl={comment.authorAvatar}
									size="xs"
								/>
								<span
									className="font-medium text-on-surface text-sm truncate min-w-0"
									title={comment.authorName}
								>
									{comment.authorName}
								</span>
							</div>
						</div>
						<div className="flex-1 min-w-62.5 text-on-surface">
							<p
								className="line-clamp-2 text-sm"
								title={comment.commentSnippet}
							>
								"{comment.commentSnippet}"
							</p>
						</div>
						<div className="w-40">
							<button
								type="button"
								className="text-primary hover:underline font-medium text-sm whitespace-nowrap truncate max-w-37.5 inline-block"
								title={comment.taskTitle}
								onClick={() => openTask(comment.taskId)}
							>
								{comment.taskTitle}
							</button>
						</div>
						<div className="w-48">
							<span className="bg-error/10 text-error text-xs font-semibold px-2 py-1 rounded inline-block">
								{comment.flagReason}
							</span>
						</div>
						<div className="w-40 text-sm text-secondary whitespace-nowrap">
							{new Date(comment.flaggedAt).toLocaleString()}
						</div>
						<div className="w-28 flex justify-end gap-2 whitespace-nowrap">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={busyId === comment.commentId}
								onClick={() => resolve(comment.commentId, "dismiss")}
								className="border-outline-variant text-secondary hover:text-on-surface"
								title="Dismiss Flag"
							>
								<Check size={16} />
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								disabled={busyId === comment.commentId}
								onClick={() => resolve(comment.commentId, "delete")}
								className="bg-error text-error-foreground hover:bg-error/90"
								title="Delete Comment"
							>
								<Trash2 size={16} />
							</Button>
						</div>
					</>
				)}
			/>
		</section>
	);
}
