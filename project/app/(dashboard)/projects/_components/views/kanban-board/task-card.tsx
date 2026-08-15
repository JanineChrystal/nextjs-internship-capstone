"use client";

import { Calendar, CheckSquare, Paperclip } from "lucide-react";
import { PriorityBadge } from "@/app/(dashboard)/_components/ui/badges/priority-badge";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { GridTask } from "@/types/task";
import { TASK_CARD_FOOTER_METRICS } from "../../../_constants/kanban";
import { useTaskCard } from "../../../_hooks/use-task-card";

interface TaskCardProps {
	task: GridTask;
}

export function TaskCard({ task }: TaskCardProps) {
	const {
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
		toggleTaskSelection,
		openTaskModal,
	} = useTaskCard(task);

	const getMetricValue = (id: string) => {
		switch (id) {
			case "attachments":
				return task.attachments?.length || 0;
			case "checklist":
				return tasksTotal > 0 ? `${tasksCompleted}/${tasksTotal}` : null;
			case "date":
				return formattedDate;
			default:
				return null;
		}
	};

	const MetricIcon = {
		Paperclip,
		CheckSquare,
		Calendar,
	};

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
			<div className="flex justify-between items-start">
				{/* biome-ignore lint/a11y/noStaticElementInteractions: We just want to prevent drag propagation */}
				<div
					className="pt-0.5"
					role="presentation"
					onPointerDown={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<Checkbox
						checked={isSelected}
						onCheckedChange={() => toggleTaskSelection(task.id)}
					/>
				</div>
				<div className="flex items-center gap-2">
					{formattedPriority && <PriorityBadge priority={formattedPriority} />}
					{formattedTag && <TagBadge tag={formattedTag} />}
				</div>
			</div>

			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					openTaskModal(task.id);
				}}
				onPointerDown={(e) => e.stopPropagation()}
				className="text-left font-body-sm text-body-sm text-foreground leading-tight font-medium hover:text-primary transition-colors focus:outline-none focus-visible:underline"
			>
				{task.name}
			</button>

			{tasksTotal > 0 && (
				<div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all"
						style={{ width: `${(tasksCompleted / tasksTotal) * 100}%` }}
					/>
				</div>
			)}

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
					{TASK_CARD_FOOTER_METRICS.map((metric) => {
						const value = getMetricValue(metric.id);
						if (!value) return null;
						const Icon = MetricIcon[metric.icon as keyof typeof MetricIcon];
						return (
							<div key={metric.id} className="flex items-center gap-1">
								<Icon className="w-3.5 h-3.5" /> {value}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
