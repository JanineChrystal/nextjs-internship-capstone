"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { MemberAvatar } from "@/components/ui/member-avatar";
import type { NotificationFeedItemDTO } from "@/lib/dtos/activity-dto";
import { cn } from "@/lib/utils";
import { toActivityLabel } from "../../_constants/activity";

interface NotificationRowProps {
	notification: NotificationFeedItemDTO;
	onMarkRead: (id: string) => void;
	onRemove: (id: string) => void;
}

/**
 * notification row - renders individual notifications with explicit controls
 * for dismissing or marking as read without navigating, resolving accessibility
 * and interaction issues with the previous clickable-row design.
 */
export function NotificationRow({
	notification,
	onMarkRead,
	onRemove,
}: NotificationRowProps) {
	const body = (
		<>
			<MemberAvatar
				name={notification.actorName ?? "System"}
				avatarUrl={notification.actorAvatarUrl}
				size="md"
			/>

			<div className="flex-1 min-w-0 text-left">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="text-sm font-medium text-on-surface">
						{notification.actorName ?? "System"}
					</span>
					<span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-surface-variant text-secondary">
						{toActivityLabel(notification.actionType)}
					</span>
				</div>

				<p className="text-sm text-secondary mt-0.5 wrap-anywhere">
					{notification.message}
				</p>

				<time
					dateTime={new Date(notification.createdAt).toISOString()}
					className="text-xs text-secondary/80 mt-1 block"
				>
					{new Date(notification.createdAt).toLocaleTimeString([], {
						hour: "numeric",
						minute: "2-digit",
					})}
				</time>
			</div>

			{!notification.isRead && (
				<>
					<span className="sr-only">Unread</span>
					<span
						aria-hidden="true"
						className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
					/>
				</>
			)}
		</>
	);

	const bodyClassName = "flex flex-1 min-w-0 gap-3 p-4 text-left";

	/**
	 * always visible controls - keeps row controls dimmed rather than hidden,
	 * ensuring they are discoverable and accessible on touch screens without
	 * relying on hover states.
	 */
	const controlClassName =
		"shrink-0 text-secondary opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100";

	return (
		<li
			// independent interactions - removes group hover classes since row elements no longer depend on container hover state.
			className={cn(
				"flex items-start rounded-lg border transition-colors",
				notification.isRead
					? "border-outline-variant bg-surface hover:bg-surface-variant/40"
					: "border-primary/30 bg-primary/5 hover:bg-primary/10",
			)}
		>
			{notification.projectId ? (
				<Link
					href={`/projects/${notification.projectId}`}
					className={bodyClassName}
					onClick={() => onMarkRead(notification.id)}
				>
					{body}
				</Link>
			) : (
				<div className={bodyClassName}>{body}</div>
			)}

			<div className="flex shrink-0 items-center gap-1 p-2">
				{/* contextual controls - hides the mark as read button on already-read rows to avoid presenting non-functional actions. */}
				{!notification.isRead && (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => onMarkRead(notification.id)}
						aria-label="Mark as read"
						title="Mark as read"
						className={cn(controlClassName, "hover:text-success")}
					>
						<Check className="h-4 w-4" />
					</Button>
				)}

				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={() => onRemove(notification.id)}
					aria-label="Remove notification"
					title="Remove notification"
					className={cn(controlClassName, "hover:text-error")}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</li>
	);
}
