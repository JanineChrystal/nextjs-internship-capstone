"use client";

import { useState } from "react";
import { ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import type { TabOption } from "@/lib/types/nav";
import { TaskActivity } from "./task-activity";
import { TaskComments } from "./task-comments";

type TaskPanelTab = "comments" | "activity";

// Hoisted so the strip is not rebuilt on every render (AGENTS section 10).
const TASK_PANEL_TABS: TabOption<TaskPanelTab>[] = [
	{ label: "Comments", value: "comments" },
	{ label: "Activity", value: "activity" },
];

interface TaskSidePanelProps {
	taskId: string | undefined;
	projectId: string | undefined;
	isOpen: boolean;
}

/**
 * The task modal's right-hand panel, which now holds two views of the same task:
 * the discussion, and what has been done to it.
 *
 * Owning the tab strip here rather than inside TaskComments keeps each tab a
 * plain content component with one job, and means adding a third view later is
 * a new file plus one array entry rather than a rewrite.
 *
 * Both tabs stay mounted. Comments hold unsent text and scroll position that
 * would be thrown away by unmounting, and the activity tab defers its own fetch
 * until it is actually the active tab, so keeping it mounted costs nothing.
 */
export function TaskSidePanel({
	taskId,
	projectId,
	isOpen,
}: TaskSidePanelProps) {
	const [activeTab, setActiveTab] = useState<TaskPanelTab>("comments");

	return (
		<div className="flex flex-col h-full min-h-0 bg-surface-container-lowest">
			<div className="px-4 py-3 pr-16 border-b border-outline-variant shrink-0">
				<ViewTabs
					tabs={TASK_PANEL_TABS}
					activeView={activeTab}
					onViewChange={setActiveTab}
				/>
			</div>

			{/* Kept mounted and hidden rather than swapped out - see note above. */}
			<div
				className={`flex-1 min-h-0 flex flex-col ${activeTab === "comments" ? "" : "hidden"}`}
			>
				<TaskComments taskId={taskId} isOpen={isOpen} />
			</div>

			<div
				className={`flex-1 min-h-0 flex flex-col ${activeTab === "activity" ? "" : "hidden"}`}
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
