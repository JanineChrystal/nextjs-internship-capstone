"use client";

import {
	closestCorners,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { DEFAULT_TASK_ITEMS } from "@/app/(dashboard)/_constants/task";
import { useProjectStore } from "@/stores/use-project-store";
import { columnsConfig } from "../../../_constants/kanban";
import { useKanbanDnd } from "../../../_hooks/use-kanban-dnd";
import { Column } from "./column";

export function KanbanBoard({ projectId }: { projectId: string }) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject = projects.find((p) => p.id === projectId);

	const { tasks, handleDragStart, handleDragOver, handleDragEnd } =
		useKanbanDnd(DEFAULT_TASK_ITEMS);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	return (
		<div className="flex flex-col gap-6 w-full">
			<PageHeader
				title="Kanban Board"
				description={`Manage and organize tasks for ${currentProject?.title || "this project"} in a visual board.`}
			/>

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
		</div>
	);
}
