import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";
import type { TaskItem } from "@/types/task";

export function useKanbanDnd(initialData: TaskItem[]) {
	// Local State
	const [tasks, setTasks] = useState<TaskItem[]>(initialData);
	const [activeId, setActiveId] = useState<string | null>(null);

	// Action Handlers
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
		const isOverTask = over.data.current?.type === "Task";
		const isOverColumn = over.data.current?.type === "Column";

		if (!isActiveTask) return;

		// Scenario 1: Dragging a task over another task
		if (isActiveTask && isOverTask) {
			setTasks((prevTasks) => {
				const activeIndex = prevTasks.findIndex((t) => t.id === activeId);
				const overIndex = prevTasks.findIndex((t) => t.id === overId);

				if (prevTasks[activeIndex].columnId !== prevTasks[overIndex].columnId) {
					const newTasks = [...prevTasks];
					newTasks[activeIndex].columnId = prevTasks[overIndex].columnId;
					return arrayMove(newTasks, activeIndex, overIndex);
				}
				return arrayMove(prevTasks, activeIndex, overIndex);
			});
		}

		// Scenario 2: Dragging a task into an empty column
		if (isActiveTask && isOverColumn) {
			setTasks((prevTasks) => {
				const activeIndex = prevTasks.findIndex((t) => t.id === activeId);
				const newTasks = [...prevTasks];
				newTasks[activeIndex].columnId = overId as string;
				return arrayMove(newTasks, activeIndex, activeIndex);
			});
		}
	};

	const handleDragEnd = (_event: DragEndEvent) => {
		setActiveId(null);
	};

	return {
		tasks,
		activeId,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	};
}
