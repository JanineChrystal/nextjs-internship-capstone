"use client";

import { History, ListChecks, MessageSquare } from "lucide-react";
import type { TaskMobilePane } from "@/lib/types/task";
import { cn } from "@/lib/utils";

const PANES: {
	value: TaskMobilePane;
	label: string;
	icon: typeof ListChecks;
}[] = [
	{ value: "details", label: "Details", icon: ListChecks },
	{ value: "comments", label: "Comments", icon: MessageSquare },
	{ value: "activity", label: "Activity", icon: History },
];

interface TaskMobileTabsProps {
	activePane: TaskMobilePane;
	onPaneChange: (pane: TaskMobilePane) => void;
	commentCount?: number;
}

/**
 * task modal bottom strip - the phone-sized replacement for the desktop's
 * side-by-side panes.
 *
 * Below `md` there is no room to show details and comments at once, and the
 * previous layout stacked them: the comments panel and its composer sat under
 * the details column and took most of the screen, leaving the task's own fields
 * in a sliver. Here only one panel is on screen at a time and this strip is the
 * only pinned element, so whichever panel is showing gets the full height.
 */
export function TaskMobileTabs({
	activePane,
	onPaneChange,
	commentCount,
}: TaskMobileTabsProps) {
	return (
		<nav
			aria-label="Task sections"
			className="flex shrink-0 items-stretch border-t border-outline-variant bg-surface-container-lowest md:hidden"
		>
			{PANES.map((pane) => {
				const Icon = pane.icon;
				const isActive = activePane === pane.value;

				return (
					<button
						key={pane.value}
						type="button"
						onClick={() => onPaneChange(pane.value)}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
							// The active pane is marked with a top rule as well as colour, so
							// it survives a palette whose accent is low-contrast on this surface.
							isActive
								? "border-t-2 border-primary text-primary"
								: "border-t-2 border-transparent text-secondary hover:text-on-surface",
						)}
					>
						<Icon className="size-4" aria-hidden="true" />
						<span>
							{pane.label}
							{pane.value === "comments" && commentCount
								? ` (${commentCount})`
								: ""}
						</span>
					</button>
				);
			})}
		</nav>
	);
}
