"use client";

import { Check, ShieldAlert, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { SectionTitle } from "@/components/ui/sections";
import { GridTable } from "@/components/views/grid-table/grid-table";
import { useMemberStore } from "@/stores/use-member-store";
import {
	COMMENT_MODERATION_COLUMNS,
	emptyComments,
	settingsSectionTexts,
} from "../../../_constants/settings-view";

interface CommentModerationSectionProps {
	projectId: string;
}

export function CommentModerationSection({
	projectId,
}: CommentModerationSectionProps) {
	const { flaggedComments, resolveFlaggedComment } = useMemberStore();

	const comments = flaggedComments[projectId] ?? emptyComments;

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

			<GridTable
				data={comments}
				columns={COMMENT_MODERATION_COLUMNS}
				keyExtractor={(comment) => comment.commentId}
				renderEmptyState={() => (
					<div className="flex flex-col items-center justify-center py-10 border-t border-dashed border-outline-variant bg-surface-container-lowest">
						<ShieldAlert size={48} className="text-secondary/50 mb-4" />
						<h3 className="text-lg font-semibold text-on-surface">
							No flagged comments
						</h3>
						<p className="text-sm text-secondary">
							Everything is looking good!
						</p>
					</div>
				)}
				renderRow={(comment) => (
					<>
						<div className="w-44 whitespace-nowrap">
							<div className="flex items-center gap-2">
								{comment.authorAvatar ? (
									<Image
										src={comment.authorAvatar}
										alt={comment.authorName}
										width={24}
										height={24}
										className="rounded-full shrink-0"
									/>
								) : (
									<div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
										{comment.authorName.charAt(0)}
									</div>
								)}
								<span className="font-medium text-on-surface text-sm">
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
								// This would route to /projects/[projectId]?task=[taskId] later on
								onClick={() => alert(`Navigating to task: ${comment.taskId}`)}
							>
								{comment.taskTitle}
							</button>
						</div>
						<div className="w-48">
							<span className="bg-error/10 text-error text-xs font-semibold px-2 py-1 rounded inline-block">
								{comment.flagReason}
							</span>
						</div>
						<div className="w-28 flex justify-end gap-2 whitespace-nowrap">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									resolveFlaggedComment(projectId, comment.commentId, "accept")
								}
								className="border-outline-variant text-secondary hover:text-on-surface"
								title="Dismiss Flag"
							>
								<Check size={16} />
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() =>
									resolveFlaggedComment(projectId, comment.commentId, "reject")
								}
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
