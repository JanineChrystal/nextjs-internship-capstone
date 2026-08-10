"use client";

import { Check, ShieldAlert, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { useMemberStore } from "@/stores/use-member-store";

interface CommentModerationSectionProps {
	projectId: string;
}

export function CommentModerationSection({
	projectId,
}: CommentModerationSectionProps) {
	const { flaggedComments, resolveFlaggedComment } = useMemberStore();

	const comments = flaggedComments[projectId] || [];

	if (comments.length === 0) {
		return (
			<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
				<div>
					<h2 className="text-xl font-bold text-on-surface">
						Comment Moderation
					</h2>
					<p className="text-sm text-secondary">
						Review and resolve comments flagged by users or automated filters.
					</p>
				</div>
				<div className="flex flex-col items-center justify-center py-10 border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest">
					<ShieldAlert size={48} className="text-secondary/50 mb-4" />
					<h3 className="text-lg font-semibold text-on-surface">
						No flagged comments
					</h3>
					<p className="text-sm text-secondary">Everything is looking good!</p>
				</div>
			</section>
		);
	}

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<div>
				<h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
					Comment Moderation
					<span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full font-bold">
						{comments.length}
					</span>
				</h2>
				<p className="text-sm text-secondary">
					Review and resolve comments flagged by users or automated filters.
				</p>
			</div>

			<div className="border border-outline-variant rounded-lg overflow-x-auto">
				<table className="w-full text-sm text-left">
					<thead className="bg-surface-container-lowest border-b border-outline-variant text-secondary text-xs uppercase whitespace-nowrap">
						<tr>
							<th className="px-4 py-3 font-medium">Author</th>
							<th className="px-4 py-3 font-medium min-w-50">Comment</th>
							<th className="px-4 py-3 font-medium">Task</th>
							<th className="px-4 py-3 font-medium min-w-37.50">Flag Reason</th>
							<th className="px-4 py-3 font-medium text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{comments.map((comment) => (
							<tr
								key={comment.commentId}
								className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30"
							>
								<td className="px-4 py-3 whitespace-nowrap">
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
										<span className="font-medium text-on-surface">
											{comment.authorName}
										</span>
									</div>
								</td>
								<td className="px-4 py-3 text-on-surface">
									<p className="line-clamp-2" title={comment.commentSnippet}>
										"{comment.commentSnippet}"
									</p>
								</td>
								<td className="px-4 py-3">
									<button
										type="button"
										className="text-primary hover:underline font-medium whitespace-nowrap truncate max-w-37.5 inline-block"
										title={comment.taskTitle}
										// In a real app, this would route to /projects/[projectId]?task=[taskId]
										onClick={() =>
											alert(`Navigating to task: ${comment.taskId}`)
										}
									>
										{comment.taskTitle}
									</button>
								</td>
								<td className="px-4 py-3">
									<span className="bg-error/10 text-error text-xs font-semibold px-2 py-1 rounded">
										{comment.flagReason}
									</span>
								</td>
								<td className="px-4 py-3 text-right whitespace-nowrap">
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												resolveFlaggedComment(
													projectId,
													comment.commentId,
													"accept",
												)
											}
											className="border-outline-variant text-secondary hover:text-on-surface"
											title="Dismiss Flag"
										>
											<Check size={16} />
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() =>
												resolveFlaggedComment(
													projectId,
													comment.commentId,
													"reject",
												)
											}
											className="bg-error text-error-foreground hover:bg-error/90"
											title="Delete Comment"
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
