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
 * One notification.
 *
 * ## Two ways to mark something read, for two different intentions
 *
 * A notification about a project is a link: clicking the body marks it read AND
 * takes you there, because those are the same intent - you read a notification
 * by going to look at the thing it is about.
 *
 * But that used to be the ONLY way. Clearing a single notification meant
 * navigating away from the page you were tidying, and the alternative was "Mark
 * all as read", which cannot say "I have seen this one and not the others". The
 * check button beside the dismiss control covers that second intention: read it,
 * stay here.
 *
 * ## Why a notification with no project is no longer clickable
 *
 * It used to render the body as a `<button>` whose only effect was marking it
 * read - identical in appearance to the rows that navigate, with nothing to say
 * it did anything, and silently broken under middle-click because it was not a
 * link. Those rows are now plain content, and the check button is the way to
 * mark them read. One affordance that says what it does beats two that look the
 * same and behave differently.
 *
 * The controls sit outside the clickable body rather than inside it. Nesting a
 * button inside a link is invalid HTML and leaves the two competing for the same
 * click, so the row is a row: body, then controls.
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
	 * Always visible, never revealed on hover.
	 *
	 * Both controls used to sit at `opacity-0` until the row was hovered. The
	 * CSS for that works - the reveal rule is generated and is not gated behind
	 * `@media (hover: hover)` - but it fails as a design in three ways at once,
	 * and the first person to look for the new button could not find it:
	 *
	 *   - Nothing hints that hovering will produce anything, so a control that
	 *     is invisible until you happen to pass over it is a control most people
	 *     never learn exists.
	 *   - There is no hover on a touch screen. Whatever the media query says,
	 *     a finger either taps something or it does not, and "reveal on hover"
	 *     has no meaning on a phone.
	 *   - It puts the affordance and the action in different moments: you have
	 *     to already suspect something is there before the page will admit it.
	 *
	 * Dimmed instead of hidden. The controls stay quiet enough that the message
	 * is still the loudest thing in the row, and they are visible at rest, which
	 * is the whole difference.
	 */
	const controlClassName =
		"shrink-0 text-secondary opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100";

	return (
		<li
			// No `group` any more: nothing in this row reacts to the row being
			// hovered now that the controls are always visible, and leaving the
			// class behind would imply a relationship that no longer exists.
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
				{/* Only while it is unread. A "mark as read" on an already-read row is
				    a control that cannot do anything, and one that does nothing when
				    pressed teaches people to distrust the rest. */}
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
