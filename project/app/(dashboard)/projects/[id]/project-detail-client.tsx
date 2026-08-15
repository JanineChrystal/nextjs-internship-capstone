"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { FilterPopover } from "@/components/ui/filters/filter-popover";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import type { GridTask } from "@/lib/types/task";
import type { Project } from "@/lib/validations/project-schema";
import { useBoardStore } from "@/stores/use-board-store";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
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

interface ProjectDetailClientProps {
	projectId: string;
	project: ProjectOutputDTO;
	projectUI: Project;
	tasks: GridTask[];
	boards: { id: string; name: string; position: number }[];
}

export function ProjectDetailClient({
	projectId,
	project,
	projectUI,
	tasks,
	boards,
}: ProjectDetailClientProps) {
	const setTasks = useTaskStore((state) => state.setTasks);
	const setColumns = useBoardStore((state) => state.setColumns);
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!isInitialized.current) {
			const existingProjects = useProjectStore.getState().projects;
			if (!existingProjects.some((p) => p.id === project.id)) {
				useProjectStore.getState().addProject(projectUI);
			} else {
				useProjectStore.getState().updateProject(project.id, projectUI);
			}

			setTasks(tasks);

			const formattedColumns = boards.map((b) => ({
				id: b.id,
				title: b.name,
				dotColor: "bg-primary",
				order: b.position,
			}));
			setColumns(formattedColumns);

			isInitialized.current = true;
		}
	}, [project, projectUI, tasks, boards, setTasks, setColumns]);

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
			<ProjectHeader projectId={projectId} project={projectUI} />

			<ProjectToolbar
				projectId={projectId}
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

			<div className="w-full mt-4">
				{activeView === "board" && (
					<KanbanBoard projectId={projectId} externalFilters={filters} />
				)}
				{activeView === "grid" && (
					<GridView projectId={projectId} externalFilters={filters} />
				)}
				{activeView === "calendar" && <CalendarView projectId={projectId} />}
				{activeView === "charts" && <div>Charts View Draft</div>}
				{activeView === "settings" && <SettingsView projectId={projectId} />}
			</div>

			<TaskModal />
		</div>
	);
}
