"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { useRecordSkeletonCount } from "@/hooks/use-skeleton-count";
import type { NotificationFeedItemDTO } from "@/lib/dtos/activity-dto";
import { useNotifications } from "../_hooks/use-notifications";
import { NotificationRow } from "./notification-row";

interface NotificationsClientProps {
	initialNotifications: NotificationFeedItemDTO[];
	initialHasMore: boolean;
}

export function NotificationsClient({
	initialNotifications,
	initialHasMore,
}: NotificationsClientProps) {
	const {
		notifications,
		groups,
		unreadCount,
		hasMore,
		isLoadingMore,
		isBusy,
		markRead,
		markAllRead,
		remove,
		loadMore,
	} = useNotifications(initialNotifications, initialHasMore);

	// skeleton hydration - records current notification count to properly size the loading skeleton on subsequent visits.
	useRecordSkeletonCount("notifications", notifications.length);

	const [isConfirmingMarkAll, setIsConfirmingMarkAll] = useState(false);

	return (
		<div className="flex flex-col gap-6 w-full mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* topAction, not a sibling - as a flex item beside the button the header shrank to its own content and read half-height next to every other page. */}
			<PageHeader
				title="Notifications"
				description={
					unreadCount > 0
						? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
						: "You are all caught up."
				}
				topAction={
					unreadCount > 0 ? (
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsConfirmingMarkAll(true)}
							disabled={isBusy}
							className="w-full gap-2 sm:w-auto"
						>
							<CheckCheck className="h-4 w-4" />
							Mark all as read
						</Button>
					) : undefined
				}
			/>

			{/* confirmation boundary - requires confirmation for bulk destructive actions while leaving individual dismissals immediate for better flow. */}
			<ConfirmDialog
				isOpen={isConfirmingMarkAll}
				onClose={() => setIsConfirmingMarkAll(false)}
				onConfirm={() => {
					setIsConfirmingMarkAll(false);
					markAllRead();
				}}
				tone="info"
				title={`Mark ${unreadCount} ${unreadCount === 1 ? "notification" : "notifications"} as read?`}
				description="They stay on this page, but the unread badge clears everywhere. This cannot be undone."
				confirmLabel="Mark all as read"
			/>

			{notifications.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest py-16 text-center">
					<BellOff className="h-10 w-10 text-secondary/50 mb-4" />
					<h3 className="text-lg font-semibold text-on-surface">
						No notifications yet
					</h3>
					<p className="text-sm text-secondary max-w-sm mt-1">
						You will be notified when someone assigns you a task, comments on a
						task you are working on, or adds you to a project.
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					{groups.map((group) => (
						<section key={group.key} className="flex flex-col gap-2">
							{/* sticky headers - keeps date headings visible during scroll for better context in long lists. */}
							<h2 className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-background text-xs font-semibold uppercase tracking-wide text-secondary">
								{group.heading}
							</h2>

							<ul className="flex flex-col gap-2">
								{group.items.map((notification) => (
									<NotificationRow
										key={notification.id}
										notification={notification}
										onMarkRead={markRead}
										onRemove={remove}
									/>
								))}
							</ul>
						</section>
					))}

					{hasMore && (
						<div className="flex justify-center pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={loadMore}
								disabled={isLoadingMore}
							>
								{isLoadingMore ? "Loading..." : "Load more"}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
