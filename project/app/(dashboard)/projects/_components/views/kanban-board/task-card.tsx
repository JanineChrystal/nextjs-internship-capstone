"use client";

import { Edit2 } from "lucide-react";
import { BaseTaskCard } from "@/app/(dashboard)/_components/ui/cards/base-task-card";
import type { TaskItem } from "@/types/task";
import { useDraggableTask } from "../../../_hooks/use-drag-task";

interface TaskCardProps {
	task: TaskItem;
}

export function TaskCard({ task }: TaskCardProps) {
	const { attributes, listeners, setNodeRef, style, isDragging } =
		useDraggableTask(task);

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`transition-all cursor-grab active:cursor-grabbing ${
				isDragging ? "opacity-50 ring-2 ring-primary z-50 rounded-lg" : ""
			}`}
		>
			<BaseTaskCard
				task={task}
				headerAction={
					<Edit2 className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
				}
				className={isDragging ? "" : "hover:border-primary/50"}
			/>
		</div>
	);
}
