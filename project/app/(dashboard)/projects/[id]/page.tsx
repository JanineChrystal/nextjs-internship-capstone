"use client";

import { use, useState } from "react";
import { useProjectStore } from "@/stores/use-project-store";
import { ProjectHeader } from "../_components/ui/project-header/project-header";
import { ProjectToolbar } from "../_components/ui/project-toolbar";
import { GridView } from "../_components/views/grid-view/grid-view";
// Import your draft view components (we will build these next)
import { KanbanBoard } from "../_components/views/kanban-board/kanban-board";
// import { CalendarView } from "./_components/views/calendar-view";
// import { ChartsView } from "./_components/views/charts-view";
// import { SettingsView } from "./_components/views/settings-view";

// Dummy data for testing the header edit functionality before fetching real data

// Define our valid view types
export type ProjectViewType =
	| "grid"
	| "board"
	| "calendar"
	| "charts"
	| "settings";

export default function ProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const projects = useProjectStore((state) => state.projects);
	const currentProject =
		projects.find((p) => p.id === resolvedParams.id) || projects[0];
	// 1. State to track which tab is currently active
	const [activeView, setActiveView] = useState<ProjectViewType>("board");

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			{/* 1. The Header (Edit/View functionality) */}
			<ProjectHeader projectId={resolvedParams.id} project={currentProject} />
			{/* 2. The Toolbar (Tabs and Actions) */}
			<ProjectToolbar activeView={activeView} onViewChange={setActiveView} />

			{/* 3. Implementation Tasks Banner (Strictly Preserved) */}
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
				<h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
					🎯 Kanban Board Implementation Tasks
				</h3>
				<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
					<li>• Task 5.1: Design responsive Kanban board layout</li>
					<li>
						• Task 5.2: Implement drag-and-drop functionality with dnd-kit
					</li>
					<li>
						• Task 5.4: Implement optimistic UI updates for smooth interactions
					</li>
					<li>• Task 5.6: Create task detail modals and editing interfaces</li>
				</ul>
			</div>

			{/* 4. The Canvas (Dynamically renders based on activeView state) */}
			<div className="w-full mt-4">
				{activeView === "board" && (
					<KanbanBoard projectId={resolvedParams.id} />
				)}
				{activeView === "grid" && <GridView />}
				{activeView === "calendar" && <div>Calendar View Draft</div>}
				{activeView === "charts" && <div>Charts View Draft</div>}
				{activeView === "settings" && <div>Project Settings Draft</div>}
			</div>
		</div>
	);
}
