"use client";

import { use, useMemo, useState } from "react";
import {
	type FilterField,
	FilterPopover,
} from "@/components/ui/filters/filter-popover";
import {
	TASK_BOARDS,
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
import { useProjectStore } from "@/stores/use-project-store";
import { TaskModal } from "../_components/ui/modals/task-modal/task-modal";
import { ProjectHeader } from "../_components/ui/project-header/project-header";
import { ProjectToolbar } from "../_components/ui/project-toolbar";
import { CalendarView } from "../_components/views/calendar-view";
import { GridView } from "../_components/views/grid-view";
// Import your draft view components (we will build these next)
import { KanbanBoard } from "../_components/views/kanban-board/kanban-board";
// import { ChartsView } from "./_components/views/charts-view";
import { SettingsView } from "../_components/views/settings-view";

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

	// 2. Global filter state
	const [filters, setFilters] = useState<Record<string, string[]>>({});

	const handleToggleFilter = (fieldId: string, value: string) => {
		setFilters((prev) => {
			const currentValues = prev[fieldId] || [];
			const nextValues = currentValues.includes(value)
				? currentValues.filter((v) => v !== value)
				: [...currentValues, value];

			return {
				...prev,
				[fieldId]: nextValues,
			};
		});
	};

	const handleResetFilters = () => setFilters({});

	const filterFields: FilterField[] = useMemo(
		() => [
			{ id: "status", label: "Status", options: TASK_STATUSES },
			{ id: "priority", label: "Priority", options: TASK_PRIORITIES },
			{ id: "board", label: "Board", options: TASK_BOARDS },
			{ id: "tag", label: "Tag", options: TASK_TAGS },
		],
		[],
	);

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
					<KanbanBoard projectId={resolvedParams.id} />
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
