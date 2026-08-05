"use client";

import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import type { TaskItem } from "@/types/task";
import { TaskCard } from "./task-card";

interface ColumnProps {
	id: string;
	title: string;
	dotColor: string;
	tasks: TaskItem[];
}

export function Column({ id, title, dotColor, tasks }: ColumnProps) {
	const { setNodeRef, isOver } = useDroppable({
		id,
		data: { type: "Column", columnId: id },
	});

	return (
		<div
			ref={setNodeRef}
			className={`shrink-0 w-80 flex flex-col gap-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-4 h-full shadow-sm transition-colors ${
				isOver ? "ring-1 ring-primary/30 bg-surface-container-low" : ""
			}`}
		>
			<div className="flex items-center justify-between mb-2">
				<h3 className="font-label-md text-label-md text-on-surface flex items-center gap-2">
					<span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
					{title} <span className="text-secondary ml-1">{tasks.length}</span>
				</h3>
				<Button
					variant="ghost"
					size="icon"
					className="text-secondary hover:text-on-surface transition-colors"
				>
					<MoreHorizontal className="w-5 h-5" />
				</Button>
			</div>

			<div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-37.5">
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					{tasks.map((task) => (
						<TaskCard key={task.id} task={task} />
					))}
				</SortableContext>
			</div>

			<Button
				variant="outline"
				className="w-full py-2 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-lg transition-colors font-label-sm text-label-sm mt-2 border border-dashed border-outline-variant bg-transparent"
			>
				<Plus className="w-4.5 h-4.5" /> Add Tasks
			</Button>
		</div>
	);
}
