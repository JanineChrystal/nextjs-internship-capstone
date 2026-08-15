import { useMemo } from "react";
import { useBoardStore } from "@/stores/use-board-store";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKanbanDnd } from "./use-kanban-dnd";
import { useTaskBulkActions } from "./use-task-bulk-actions";

export function useKanbanBoard(
	projectId: string,
	externalFilters?: Record<string, string[]>,
) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject =
		projects.find((p) => p.id === projectId) || projects[0];

	const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
	const handleClearSelection = useTaskStore(
		(state) => state.clearTaskSelection,
	);
	const addColumn = useBoardStore((state) => state.addColumn);

	const { tasks, columns, handleDragStart, handleDragOver, handleDragEnd } =
		useKanbanDnd(projectId, externalFilters);

	const bulkActions = useTaskBulkActions({
		projectId,
		selectedTaskIds,
		clearSelection: handleClearSelection,
	});

	const sortedColumns = useMemo(
		() => [...columns].sort((a, b) => a.order - b.order),
		[columns],
	);

	return {
		currentProject,
		selectedTaskIds,
		tasks,
		columns,
		sortedColumns,
		handleClearSelection,
		...bulkActions,
		addColumn,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	};
}
