"use client";

import { ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import type { TabOption } from "@/lib/types/nav";
import type { TaskPanelTab } from "@/lib/types/task";
import { TaskActivity } from "./task-activity";
import { TaskComments } from "./task-comments";

// tab configuration - hoisted outside the component to prevent unnecessary re-renders as per AGENTS section 10.
const TASK_PANEL_TABS: TabOption<TaskPanelTab>[] = [
	{ label: "Comments", value: "comments" },
	{ label: "Activity", value: "activity" },
];

interface TaskSidePanelProps {
	taskId: string | undefined;
	projectId: string | undefined;
	isOpen: boolean;
	activeTab: TaskPanelTab;
	onTabChange: (tab: TaskPanelTab) => void;
}

/**
 * task side panel component - the comments and activity views.
 *
 * The tab state is owned by the modal rather than by this component, because on
 * a phone the same choice is made from the bottom strip instead of from the row
 * here. Two sources for one selection would let the strip and the row disagree.
 * The row is therefore desktop-only; the strip replaces it below `md`.
 *
 * Tabs stay mounted so unsent comment text and scroll position survive a switch,
 * with activity fetching deferred until it is actually shown.
 */
export function TaskSidePanel({
	taskId,
	projectId,
	isOpen,
	activeTab,
	onTabChange,
}: TaskSidePanelProps) {
	return (
		<div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
			<div className="hidden shrink-0 border-b border-outline-variant px-4 py-3 md:block">
				<ViewTabs
					tabs={TASK_PANEL_TABS}
					activeView={activeTab}
					onViewChange={onTabChange}
				/>
			</div>

			{/* hidden inactive tabs - keeps content mounted via CSS to preserve state without unmounting. */}
			<div
				className={`flex min-h-0 flex-1 flex-col ${activeTab === "comments" ? "" : "hidden"}`}
			>
				<TaskComments taskId={taskId} isOpen={isOpen} />
			</div>

			<div
				className={`flex min-h-0 flex-1 flex-col ${activeTab === "activity" ? "" : "hidden"}`}
			>
				<TaskActivity
					taskId={taskId}
					projectId={projectId}
					isActive={isOpen && activeTab === "activity"}
				/>
			</div>
		</div>
	);
}
