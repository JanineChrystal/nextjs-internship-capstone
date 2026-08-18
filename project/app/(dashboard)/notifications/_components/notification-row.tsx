"use client";

import { X } from "lucide-react";
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
 * One notification.
 *
 * Clicking the body marks it read AND navigates to the project it concerns,
 * because those are the same intent - you read a notification by going to look
 * at the thing it is about. A notification with no project still marks read; it
 * just renders as a button rather than a link.
 *
 * The dismiss control sits outside that clickable area rather than inside it.
 * Nesting a button inside a link is invalid HTML and leaves the two competing
 * for the same click, so the row is a grid: body, then dismiss.
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

	return (
		<li
			className={cn(
				"flex items-start rounded-lg border transition-colors group",
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
				<button
					type="button"
					className={bodyClassName}
					onClick={() => onMarkRead(notification.id)}
				>
					{body}
				</button>
			)}

			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onClick={() => onRemove(notification.id)}
				aria-label="Remove notification"
				className="m-2 shrink-0 text-secondary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-error transition-opacity"
			>
				<X className="h-4 w-4" />
			</Button>
		</li>
	);
}
