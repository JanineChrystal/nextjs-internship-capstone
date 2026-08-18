"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { FilterPopover } from "@/components/ui/filters/filter-popover";
import { hasPermission } from "@/lib/config/permissions";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import type { RoleAccess } from "@/lib/types/member";
import type { GridTask } from "@/lib/types/task";
import type { Project } from "@/lib/validations/project-schema";
import { useBoardStore } from "@/stores/use-board-store";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import { ProjectHeader } from "../_components/ui/project-header/project-header";
import { ProjectToolbar } from "../_components/ui/project-toolbar";
import { useProjectPage } from "../_hooks/use-project-page";

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

const ChartsView = dynamic(
	() => import("../_components/views/charts-view").then((m) => m.ChartsView),
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
	boards: {
		id: string;
		name: string;
		position: number;
		isCompletionBoard: boolean;
	}[];
	role: RoleAccess;
}

export function ProjectDetailClient({
	projectId,
	project,
	projectUI,
	tasks,
	boards,
	role,
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
				dotColor: b.isCompletionBoard ? "bg-success" : "bg-primary",
				order: b.position,
				isCompletionBoard: b.isCompletionBoard,
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

	// Settings is an owner/co-owner surface. Members and guests never see the tab,
	// and this guard covers the ways they could still land on the view - a stale
	// tab in state, or a deep link - by falling back to the default view.
	const canOpenSettings = role === "owner" || role === "co-owner";
	const effectiveView =
		activeView === "settings" && !canOpenSettings ? "grid" : activeView;

	// Board columns are owner/co-owner territory too - `manage_boards` is not
	// granted to members, so offering the control only produced a refusal.
	const canManageBoards = hasPermission(role, "manage_boards");

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			<ProjectHeader projectId={projectId} project={projectUI} />

			<ProjectToolbar
				projectId={projectId}
				activeView={effectiveView}
				onViewChange={setActiveView}
				canOpenSettings={canOpenSettings}
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
				{effectiveView === "board" && (
					<KanbanBoard
						projectId={projectId}
						externalFilters={filters}
						canManageBoards={canManageBoards}
					/>
				)}
				{effectiveView === "grid" && (
					<GridView projectId={projectId} externalFilters={filters} />
				)}
				{effectiveView === "calendar" && <CalendarView projectId={projectId} />}
				{effectiveView === "charts" && <ChartsView projectId={projectId} />}
				{effectiveView === "settings" && (
					<SettingsView projectId={projectId} role={role} />
				)}
			</div>

			<TaskModal />
		</div>
	);
}
