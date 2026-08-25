"use client";

import {
	closestCorners,
	DndContext,
	MouseSensor,
	TouchSensor,
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
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { useKanbanBoard } from "../../../_hooks/use-kanban-board";
import { Column } from "./column";

export function KanbanBoard({
	projectId,
	externalFilters,
	canManageBoards = true,
}: {
	projectId: string;
	externalFilters?: Record<string, string[]>;
	// board management gate - hides the add column button for members lacking permissions, reflecting server-side authorization visually.
	canManageBoards?: boolean;
}) {
	const {
		currentProject,
		selectedTaskIds,
		tasks,
		columns,
		sortedColumns,
		handleClearSelection,
		warningModal,
		initiateBulkDelete,
		initiateBulkComplete,
		confirmWarningAction,
		closeWarningModal,
		confirmCopy,
		addColumn,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	} = useKanbanBoard(projectId, externalFilters);

	/**
	 * sensors - a mouse sensor and a touch sensor rather than one pointer sensor.
	 *
	 * A pointer sensor treats a finger like a mouse, so the distance constraint
	 * fires on the same gesture the browser uses to scroll: on a phone the board
	 * scrolled and the drag never started. The touch sensor waits instead - hold
	 * briefly and it becomes a drag, swipe and it stays a scroll. The tolerance
	 * allows a few pixels of finger movement during that hold, which is the
	 * difference between "press and hold" working and only working if you are
	 * perfectly still.
	 */
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 8 },
		}),
	);

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
				{/*
				 * horizontal at every width - the columns used to stack vertically below
				 * md, which put them in a different order from the horizontal sorting
				 * strategy this SortableContext uses, so dropping resolved against
				 * positions that were not on screen. One row that scrolls sideways keeps
				 * the layout and the strategy describing the same thing.
				 */}
				<div className="flex flex-row gap-gutter overflow-x-auto pb-4 items-start w-full min-h-[calc(100vh-250px)] hide-scrollbar snap-x snap-mandatory md:snap-none">
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
								isCompletionBoard={col.isCompletionBoard}
								tasks={tasks.filter((t) => t.board === col.title)}
							/>
						))}
					</SortableContext>

					{/* add column button - allows authorized users to create new board columns. */}
					{canManageBoards && (
						<div className="shrink-0 w-[85vw] sm:w-80 flex flex-col h-full">
							<Button
								variant="outline"
								onClick={() => addColumn(`New Column ${columns.length + 1}`)}
								className="w-full py-4 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-xl transition-colors text-label-md border-2 border-dashed border-outline-variant bg-transparent"
							>
								<Plus className="w-5 h-5" /> Add Board
							</Button>
						</div>
					)}
				</div>
			</DndContext>

			<BulkActionBar
				selectedCount={selectedTaskIds.size}
				onClearSelection={handleClearSelection}
				onDelete={initiateBulkDelete}
				onComplete={initiateBulkComplete}
			/>

			{/* confirmation dialog - reuses shared bulk action warnings centralized in the task hooks. */}
			<ConfirmDialog
				isOpen={warningModal.isOpen}
				onClose={closeWarningModal}
				onConfirm={confirmWarningAction}
				{...confirmCopy}
			/>
		</div>
	);
}
