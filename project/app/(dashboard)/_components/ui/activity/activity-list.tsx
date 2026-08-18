"use client";

import { History } from "lucide-react";
import { MemberAvatar } from "@/components/ui/member-avatar";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";
import { toActivityLabel } from "../../../_constants/activity";

interface ActivityListProps {
	items: ActivityFeedItemDTO[];
	isLoading?: boolean;
	emptyMessage?: string;
	className?: string;
}

/**
 * The history feed, used by both surfaces that show one: the task modal's
 * Activity tab and the Project Activity section in project settings.
 *
 * One component rather than two because the rows are identical - the only
 * difference is which query fed them, and that decision belongs to the caller.
 * The task tab passes rows filtered to one task; project settings passes the
 * whole project. Building these separately would have meant two nearly-identical
 * layouts drifting apart the first time either was restyled.
 */
export function ActivityList({
	items,
	isLoading = false,
	emptyMessage = "No activity yet.",
	className,
}: ActivityListProps) {
	if (isLoading) {
		return (
			<p className="text-sm text-secondary text-center py-6">
				Loading activity...
			</p>
		);
	}

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center">
				<History className="h-8 w-8 text-secondary/50 mb-3" />
				<p className="text-sm text-secondary">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<ol className={className}>
			{items.map((item) => (
				<li key={item.id} className="flex gap-3 py-3">
					<MemberAvatar
						name={item.actorName}
						avatarUrl={item.actorAvatarUrl}
						size="sm"
					/>

					<div className="flex-1 min-w-0">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<span className="text-sm font-medium text-on-surface">
								{item.actorName}
							</span>
							<span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-surface-variant text-secondary">
								{toActivityLabel(item.actionType)}
							</span>
						</div>

						{item.details && (
							// wrap-anywhere so a long category or task name cannot widen
							// the panel this sits in.
							<p className="text-sm text-secondary mt-0.5 wrap-anywhere">
								{item.details}
							</p>
						)}

						<time
							dateTime={new Date(item.createdAt).toISOString()}
							className="text-xs text-secondary/80 mt-1 block"
						>
							{new Date(item.createdAt).toLocaleString()}
						</time>
					</div>
				</li>
			))}
		</ol>
	);
}
