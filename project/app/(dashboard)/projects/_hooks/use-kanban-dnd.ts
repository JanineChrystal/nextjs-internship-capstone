import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";

export function useKanbanDnd(externalFilters?: Record<string, string[]>) {
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
			if (externalFilters.tag?.length) {
				result = result.filter((t) =>
					externalFilters.tag.includes(t.tag?.toLowerCase() || ""),
				);
			}
			if (externalFilters["my-tasks"]?.includes("true")) {
				// For the demo, "Janine Chrystal" is the active user
				result = result.filter((t) =>
					t.assignees?.some((a) => a.name === "Janine Chrystal"),
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
			}
			return;
		}

		// Task over another task in a different column
		if (isOverTask) {
			const targetTask = tasks.find((t) => t.id === overId);
			if (targetTask) {
				const currentTask = tasks.find((t) => t.id === activeId);
				if (currentTask && currentTask.board !== targetTask.board) {
					moveTaskToColumn(activeId as string, targetTask.board || "to-do");
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
