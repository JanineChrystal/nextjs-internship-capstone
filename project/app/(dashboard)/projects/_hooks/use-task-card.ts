import { format } from "date-fns";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskPriority } from "@/types/task";
import { useDraggableTask } from "./use-drag-task";

export function useTaskCard(task: GridTask) {
	const { attributes, listeners, setNodeRef, style, isDragging } =
		useDraggableTask(task);

	const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
	const toggleTaskSelection = useTaskStore(
		(state) => state.toggleTaskSelection,
	);
	const openTaskModal = useTaskStore((state) => state.openTaskModal);

	const isSelected = selectedTaskIds.has(task.id);
	const formattedDate =
		task.dueDate && task.dueDate !== "--"
			? format(new Date(task.dueDate), "MMM d")
			: null;
	const tasksCompleted = task.checklist
		? task.checklist.filter((c) => c.completed).length
		: 0;
	const tasksTotal = task.checklist ? task.checklist.length : 0;

	const formattedPriority = task.priority
		? ((task.priority.charAt(0).toUpperCase() +
				task.priority.slice(1).toLowerCase()) as TaskPriority)
		: null;

	const formattedTag = task.category
		? task.category.charAt(0).toUpperCase() +
			task.category.slice(1).toLowerCase()
		: null;

	return {
		attributes,
		listeners,
		setNodeRef,
		style,
		isDragging,
		isSelected,
		formattedDate,
		tasksCompleted,
		tasksTotal,
		formattedPriority,
		formattedTag,
		formattedCategory: formattedTag,
		toggleTaskSelection,
		openTaskModal,
	};
}
