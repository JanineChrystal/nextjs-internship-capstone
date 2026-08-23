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
	// manage_boards belongs to owner and co-owner only, so a member clicking
	// "Add Board" was always going to be refused by the server. Hiding it is the
	// same treatment the Settings tab gets - the server remains the gate.
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

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
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
								isCompletionBoard={col.isCompletionBoard}
								tasks={tasks.filter((t) => t.board === col.title)}
							/>
						))}
					</SortableContext>

					{/* Add Column Button */}
					{canManageBoards && (
						<div className="shrink-0 w-80 flex flex-col h-full">
							<Button
								variant="outline"
								onClick={() => addColumn(`New Column ${columns.length + 1}`)}
								className="w-full py-4 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-xl transition-colors font-label-md text-label-md border-2 border-dashed border-outline-variant bg-transparent"
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

			{/* Same dialog and same wording as the grid view, both sourced from
			    useTaskBulkActions - the copy used to be duplicated in each. */}
			<ConfirmDialog
				isOpen={warningModal.isOpen}
				onClose={closeWarningModal}
				onConfirm={confirmWarningAction}
				{...confirmCopy}
			/>
		</div>
	);
}
