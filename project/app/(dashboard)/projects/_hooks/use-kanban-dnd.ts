import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { reorderBoardsAction } from "@/lib/actions/board-actions";
import { moveTaskAction } from "@/lib/actions/task-actions";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { Assignee } from "@/types/task";

export function useKanbanDnd(
	projectId: string,
	externalFilters?: Record<string, string[]>,
) {
	const tasks = useTaskStore((state) => state.tasks);
	const columns = useBoardStore((state) => state.columns);
	const moveTaskToColumn = useTaskStore((state) => state.moveTaskToColumn);
	const reorderColumns = useBoardStore((state) => state.reorderColumns);

	const [activeId, setActiveId] = useState<string | null>(null);

	const filteredTasks = useMemo(() => {
		let result = tasks;
		if (externalFilters) {
			if (externalFilters.status?.length) {
				result = result.filter((t) =>
					externalFilters.status.includes(t.status.toLowerCase()),
				);
			}
			if (externalFilters.priority?.length) {
				result = result.filter((t) =>
					externalFilters.priority.includes(t.priority?.toLowerCase() || ""),
				);
			}
			if (externalFilters.board?.length) {
				result = result.filter((t) =>
					externalFilters.board.includes(t.board?.toLowerCase() || ""),
				);
			}
			if (externalFilters.category?.length) {
				result = result.filter((t) =>
					externalFilters.category.includes(t.category?.toLowerCase() || ""),
				);
			}
			if (externalFilters["my-tasks"]?.includes("true")) {
				// For the demo, "Janine Chrystal" is the active user
				result = result.filter((t) =>
					t.assignees?.some((a: Assignee) => a.name === "Janine Chrystal"),
				);
			}
		}
		return result;
	}, [tasks, externalFilters]);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;
		if (activeId === overId) return;

		const isActiveTask = active.data.current?.type === "Task";
		const isOverColumn = over.data.current?.type === "Column";
		const isOverTask = over.data.current?.type === "Task";

		if (!isActiveTask) return;

		// Task over a column (empty or not)
		if (isOverColumn) {
			const targetCol = columns.find((c) => c.id === overId);
			if (targetCol) {
				moveTaskToColumn(activeId as string, targetCol.title);
				moveTaskAction(activeId as string, targetCol.id, projectId); // fire and forget optimistic
			}
			return;
		}

		// Task over another task in a different column
		if (isOverTask) {
			const targetTask = tasks.find((t) => t.id === overId);
			if (targetTask) {
				const currentTask = tasks.find((t) => t.id === activeId);
				if (currentTask && currentTask.board !== targetTask.board) {
					// Fallback: If we don't know the exact board ID, we use column lookup
					const targetCol = columns.find((c) => c.title === targetTask.board);
					moveTaskToColumn(activeId as string, targetTask.board || "to-do");
					if (targetCol) {
						moveTaskAction(activeId as string, targetCol.id, projectId);
					}
				}
			}
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null);
		const { active, over } = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;
		if (activeId === overId) return;

		const isActiveColumn = active.data.current?.type === "Column";
		const isOverColumn = over.data.current?.type === "Column";

		if (isActiveColumn && isOverColumn) {
			reorderColumns(activeId as string, overId as string);
			const oldIndex = columns.findIndex((c) => c.id === activeId);
			const newIndex = columns.findIndex((c) => c.id === overId);
			if (oldIndex !== -1 && newIndex !== -1) {
				const newColumns = [...columns];
				const [moved] = newColumns.splice(oldIndex, 1);
				newColumns.splice(newIndex, 0, moved);
				const orderedIds = newColumns.map((c) => c.id);
				reorderBoardsAction(projectId, orderedIds);
			}
		}
	};

	return {
		tasks: filteredTasks,
		columns,
		activeId,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	};
}
