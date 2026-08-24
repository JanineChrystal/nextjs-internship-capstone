"use client";

import { useState } from "react";
import { ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import type { TabOption } from "@/lib/types/nav";
import { TaskActivity } from "./task-activity";
import { TaskComments } from "./task-comments";

type TaskPanelTab = "comments" | "activity";

// tab configuration - hoisted outside the component to prevent unnecessary re-renders as per AGENTS section 10.
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
 * task side panel component - manages the right-hand views (comments and activity) within the task modal.
 * tabs are kept mounted to preserve state like unsent text and scroll positions, with activity fetching deferred until active.
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

			{/* hidden inactive tabs - keeps content mounted via CSS to preserve state without unmounting. */}
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
