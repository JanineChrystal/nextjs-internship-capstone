import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskItem } from "@/types/task";

export function useDraggableTask(task: TaskItem) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: task.id, data: { type: "Task", task } });

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
