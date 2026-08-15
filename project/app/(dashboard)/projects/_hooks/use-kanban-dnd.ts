import { useUser } from "@clerk/nextjs";
import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { reorderBoardsAction } from "@/lib/actions/board-actions";
import { moveTaskAction, reorderTasksAction } from "@/lib/actions/task-actions";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { Assignee } from "@/types/task";

export function useKanbanDnd(
	projectId: string,
	externalFilters?: Record<string, string[]>,
) {
	const { user } = useUser();
	const tasks = useTaskStore((state) => state.tasks);
	const columns = useBoardStore((state) => state.columns);
	const moveTaskToColumn = useTaskStore((state) => state.moveTaskToColumn);
	const reorderTasksInColumn = useTaskStore(
		(state) => state.reorderTasksInColumn,
	);
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
				const currentUserName = user?.fullName || "";
				result = result.filter((t) =>
					t.assignees?.some((a: Assignee) => a.name === currentUserName),
				);
			}
		}
		return result;
	}, [tasks, externalFilters, user]);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const moveTaskWithRollback = async (
		taskId: string,
		targetBoardId: string,
	) => {
		const previousTasks = useTaskStore.getState().tasks;
		try {
			const result = await moveTaskAction(taskId, targetBoardId, projectId);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to move task:", error);
		}
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
				moveTaskWithRollback(activeId as string, targetCol.id);
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
						moveTaskWithRollback(activeId as string, targetCol.id);
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
		const isActiveTask = active.data.current?.type === "Task";
		const isOverTask = over.data.current?.type === "Task";

		if (isActiveColumn && isOverColumn) {
			reorderColumns(activeId as string, overId as string);
			const oldIndex = columns.findIndex((c) => c.id === activeId);
			const newIndex = columns.findIndex((c) => c.id === overId);
			if (oldIndex !== -1 && newIndex !== -1) {
				const newColumns = [...columns];
				const [moved] = newColumns.splice(oldIndex, 1);
				newColumns.splice(newIndex, 0, moved);
				const orderedIds = newColumns.map((c) => c.id);
				reorderColumnsWithRollback(orderedIds);
			}
			return;
		}

		// Reordering tasks within the same column
		if (isActiveTask && isOverTask) {
			const activeTask = tasks.find((t) => t.id === activeId);
			const overTask = tasks.find((t) => t.id === overId);
			if (!activeTask || !overTask || activeTask.board !== overTask.board)
				return;

			const boardTitle = activeTask.board;
			const boardColumn = columns.find((c) => c.title === boardTitle);
			if (!boardColumn) return;

			const columnTasks = tasks.filter((t) => t.board === boardTitle);
			const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
			const newIndex = columnTasks.findIndex((t) => t.id === overId);
			if (oldIndex === -1 || newIndex === -1) return;

			const reordered = [...columnTasks];
			const [moved] = reordered.splice(oldIndex, 1);
			reordered.splice(newIndex, 0, moved);
			const orderedTaskIds = reordered.map((t) => t.id);

			reorderTasksInColumn(orderedTaskIds);
			reorderTasksWithRollback(boardColumn.id, orderedTaskIds);
		}
	};

	const reorderColumnsWithRollback = async (orderedIds: string[]) => {
		const previousColumns = useBoardStore.getState().columns;
		try {
			const result = await reorderBoardsAction(projectId, orderedIds);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useBoardStore.getState().setColumns(previousColumns);
			console.error("Failed to reorder columns:", error);
		}
	};

	const reorderTasksWithRollback = async (
		boardId: string,
		orderedTaskIds: string[],
	) => {
		const previousTasks = useTaskStore.getState().tasks;
		try {
			const result = await reorderTasksAction(
				projectId,
				boardId,
				orderedTaskIds,
			);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to reorder tasks:", error);
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
