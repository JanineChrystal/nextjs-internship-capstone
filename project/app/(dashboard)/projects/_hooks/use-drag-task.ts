import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskItem } from "@/types/task";

export function useDraggableTask(task: TaskItem) {
	// External Hooks
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: task.id, data: { type: "Task", task } });

	// Derived State
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return {
		attributes,
		listeners,
		setNodeRef,
		style,
		isDragging,
	};
}
