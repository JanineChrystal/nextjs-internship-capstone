"use client";

import {
	Calendar,
	CheckSquare,
	Edit2,
	Flag,
	MessageSquare,
	Paperclip,
} from "lucide-react";
import type { TaskItem } from "@/types/task";
import { useDraggableTask } from "../../../_hooks/use-drag-task";
import { TaskBadge } from "../../ui/modals/task-modal/task-badge";

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
			className={`bg-surface border border-outline-variant p-4 rounded-lg flex flex-col gap-3 transition-colors cursor-grab active:cursor-grabbing shadow-sm group ${
				isDragging
					? "opacity-50 ring-2 ring-primary z-50"
					: "hover:border-primary/50"
			}`}
		>
			<div className="flex justify-between items-start">
				<TaskBadge priority={task.priority} category={task.category} />
				<Edit2 className="w-4.5 h-4.5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
			</div>

			<p className="font-body-sm text-body-sm text-foreground leading-tight font-medium">
				{task.title}
			</p>

			<div className="flex items-center justify-between mt-2 pt-3 border-t border-outline-variant/50">
				<div className="flex -space-x-2">
					<div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-[10px] border border-surface">
						AJ
					</div>
				</div>

				<div className="flex items-center gap-3 text-secondary text-xs">
					{task.comments && (
						<div className="flex items-center gap-1">
							<MessageSquare className="w-3.5 h-3.5" /> {task.comments}
						</div>
					)}
					{task.attachments && (
						<div className="flex items-center gap-1">
							<Paperclip className="w-3.5 h-3.5" /> {task.attachments}
						</div>
					)}
					{task.date && (
						<div className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" /> {task.date}
						</div>
					)}
					{task.priority === "high" && (
						<div className="flex items-center gap-1 text-error">
							<Flag className="w-3.5 h-3.5" /> High
						</div>
					)}
					{task.tasksTotal && (
						<div className="flex items-center gap-1">
							<CheckSquare className="w-3.5 h-3.5" /> {task.tasksCompleted}/
							{task.tasksTotal}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
