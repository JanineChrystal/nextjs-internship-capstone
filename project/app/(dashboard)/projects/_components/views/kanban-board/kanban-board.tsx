"use client";

import {
	closestCorners,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { Button } from "@/components/ui/buttons/button";
import { useBoardStore } from "@/stores/board-store";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKanbanDnd } from "../../../_hooks/use-kanban-dnd";
import { Column } from "./column";

export function KanbanBoard({
	projectId,
	externalFilters,
}: {
	projectId: string;
	externalFilters?: Record<string, string[]>;
}) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject =
		projects.find((p) => p.id === projectId) || projects[0];

	const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
	const handleClearSelection = useTaskStore(
		(state) => state.clearTaskSelection,
	);
	const handleBulkDelete = useTaskStore((state) => state.bulkDeleteTasks);
	const handleBulkComplete = useTaskStore((state) => state.bulkCompleteTasks);
	const addColumn = useBoardStore((state) => state.addColumn);

	const { tasks, columns, handleDragStart, handleDragOver, handleDragEnd } =
		useKanbanDnd(externalFilters);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

	return (
		<div className="flex flex-col gap-6 w-full relative">
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
					<SortableContext
						items={sortedColumns.map((col) => col.id)}
						strategy={horizontalListSortingStrategy}
					>
						{sortedColumns.map((col) => (
							<Column
								key={col.id}
								id={col.id}
								title={col.title}
								dotColor={col.dotColor}
								tasks={tasks.filter((t) => t.board === col.title)}
							/>
						))}
					</SortableContext>

					{/* Add Column Button */}
					<div className="shrink-0 w-80 flex flex-col h-full">
						<Button
							variant="outline"
							onClick={() => addColumn(`New Column ${columns.length + 1}`)}
							className="w-full py-4 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-xl transition-colors font-label-md text-label-md border-2 border-dashed border-outline-variant bg-transparent"
						>
							<Plus className="w-5 h-5" /> Add Board
						</Button>
					</div>
				</div>
			</DndContext>

			<BulkActionBar
				selectedCount={selectedTaskIds.size}
				onClearSelection={handleClearSelection}
				onDelete={() => handleBulkDelete(selectedTaskIds)}
				onComplete={() => handleBulkComplete(selectedTaskIds)}
			/>
		</div>
	);
}
