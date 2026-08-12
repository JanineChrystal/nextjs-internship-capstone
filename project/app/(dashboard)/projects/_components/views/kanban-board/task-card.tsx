"use client";

import { format } from "date-fns";
import { Calendar, CheckSquare, Paperclip } from "lucide-react";
import { PriorityBadge } from "@/app/(dashboard)/_components/ui/badges/priority-badge";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskPriority, TaskTag } from "@/types/task";
import { useDraggableTask } from "../../../_hooks/use-drag-task";

interface TaskCardProps {
	task: GridTask;
}

export function TaskCard({ task }: TaskCardProps) {
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

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`bg-surface border p-4 rounded-lg flex flex-col gap-3 transition-all cursor-grab active:cursor-grabbing shadow-sm group ${
				isDragging
					? "opacity-50 ring-2 ring-primary z-50 border-transparent"
					: "border-outline-variant hover:border-primary/50"
			} ${isSelected ? "ring-1 ring-primary bg-primary/5" : ""}`}
		>
			{/* Top Header Row */}
			<div className="flex justify-between items-start">
				{/* biome-ignore lint/a11y/noStaticElementInteractions: We just want to prevent drag propagation */}
				<div
					className="pt-0.5"
					role="presentation"
					onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking checkbox
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<Checkbox
						checked={isSelected}
						onCheckedChange={() => toggleTaskSelection(task.id)}
					/>
				</div>
				<div className="flex items-center gap-2">
					{task.priority && (
						<PriorityBadge
							priority={
								(task.priority.charAt(0).toUpperCase() +
									task.priority.slice(1).toLowerCase()) as TaskPriority
							}
						/>
					)}
					{task.tag && (
						<TagBadge
							tag={
								(task.tag.charAt(0).toUpperCase() +
									task.tag.slice(1).toLowerCase()) as TaskTag
							}
						/>
					)}
				</div>
			</div>

			{/* Title */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					openTaskModal(task.id);
				}}
				onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking title
				className="text-left font-body-sm text-body-sm text-foreground leading-tight font-medium hover:text-primary transition-colors focus:outline-none focus-visible:underline"
			>
				{task.name}
			</button>

			{/* Footer Metadata */}
			<div className="flex items-center justify-between mt-2 pt-3 border-t border-outline-variant/50">
				<div className="flex -space-x-2">
					{task.assignees?.map((assignee) => (
						<div
							key={assignee.name}
							className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-[10px] border border-surface"
						>
							{assignee.name.substring(0, 2).toUpperCase()}
						</div>
					))}
				</div>

				<div className="flex items-center gap-3 text-secondary text-xs">
					{task.attachments && task.attachments.length > 0 ? (
						<div className="flex items-center gap-1">
							<Paperclip className="w-3.5 h-3.5" /> {task.attachments.length}
						</div>
					) : null}
					{tasksTotal > 0 ? (
						<div className="flex items-center gap-1">
							<CheckSquare className="w-3.5 h-3.5" /> {tasksCompleted}/
							{tasksTotal}
						</div>
					) : null}
					{formattedDate ? (
						<div className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" /> {formattedDate}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
