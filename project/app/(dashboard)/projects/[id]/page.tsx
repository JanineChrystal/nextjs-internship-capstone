"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { FilterPopover } from "@/components/ui/filters/filter-popover";
import { useProjectStore } from "@/stores/use-project-store";
import { ProjectHeader } from "../_components/ui/project-header/project-header";
import { ProjectToolbar } from "../_components/ui/project-toolbar";
import { useProjectPage } from "../_hooks/use-project-page";

export type ProjectViewType =
	| "grid"
	| "board"
	| "calendar"
	| "charts"
	| "settings";

const TaskModal = dynamic(
	() =>
		import("../../_components/ui/modals/task-modal/task-modal").then(
			(m) => m.TaskModal,
		),
	{ ssr: false },
);

const KanbanBoard = dynamic(
	() =>
		import("../_components/views/kanban-board/kanban-board").then(
			(m) => m.KanbanBoard,
		),
	{ ssr: false },
);

const GridView = dynamic(
	() => import("../_components/views/grid-view").then((m) => m.GridView),
	{ ssr: false },
);

const CalendarView = dynamic(
	() =>
		import("../_components/views/calendar-view").then((m) => m.CalendarView),
	{ ssr: false },
);

const SettingsView = dynamic(
	() =>
		import("../_components/views/settings-view").then((m) => m.SettingsView),
	{ ssr: false },
);

export default function ProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const projects = useProjectStore((state) => state.projects);
	const currentProject =
		projects.find((p) => p.id === resolvedParams.id) || projects[0];

	const {
		activeView,
		filters,
		filterFields,
		setActiveView,
		handleToggleFilter,
		handleResetFilters,
	} = useProjectPage();

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			{/* 1. The Header (Edit/View functionality) */}
			<ProjectHeader projectId={resolvedParams.id} project={currentProject} />
			{/* 2. The Toolbar (Tabs and Actions) */}
			<ProjectToolbar
				projectId={resolvedParams.id}
				activeView={activeView}
				onViewChange={setActiveView}
				renderFilter={
					<FilterPopover
						fields={filterFields}
						values={filters}
						onChange={handleToggleFilter}
						onReset={handleResetFilters}
					/>
				}
			/>

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
					<KanbanBoard
						projectId={resolvedParams.id}
						externalFilters={filters}
					/>
				)}
				{activeView === "grid" && (
					<GridView projectId={resolvedParams.id} externalFilters={filters} />
				)}
				{activeView === "calendar" && (
					<CalendarView projectId={resolvedParams.id} />
				)}
				{activeView === "charts" && <div>Charts View Draft</div>}
				{activeView === "settings" && (
					<SettingsView projectId={resolvedParams.id} />
				)}
			</div>

			{/* Global Task Modal */}
			<TaskModal />
		</div>
	);
}
