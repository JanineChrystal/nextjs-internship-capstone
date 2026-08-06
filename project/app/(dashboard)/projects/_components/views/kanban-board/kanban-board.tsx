"use client";

import {
	closestCorners,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { columnsConfig, initialTasks } from "../../../_constants/kanban";
import { useKanbanDnd } from "../../../_hooks/use-kanban-dnd";
import { Column } from "./column";

export function KanbanBoard({ projectId: _projectId }: { projectId: string }) {
	const { tasks, handleDragStart, handleDragOver, handleDragEnd } =
		useKanbanDnd(initialTasks);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
		>
			<div className="flex flex-col md:flex-row gap-gutter overflow-y-auto md:overflow-x-auto pb-4 items-center md:items-start w-full min-h-[calc(100vh-250px)] hide-scrollbar">
				{columnsConfig.map((col) => (
					<Column
						key={col.id}
						id={col.id}
						title={col.title}
						dotColor={col.dotColor}
						tasks={tasks.filter((t) => t.columnId === col.id)}
					/>
				))}
			</div>
		</DndContext>
	);
}
