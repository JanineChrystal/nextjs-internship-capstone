"use client";
import { useMemo } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { GridTable } from "@/components/views/grid-table/grid-table";
import { useProjectStore } from "@/stores/use-project-store";
import { GRID_COLUMNS } from "../../../_constants/grid-view";
import { useGridView } from "../../../_hooks/use-grid-view";
import { AddTaskRow } from "./add-task-row";
import { GridRow } from "./grid-row";

export function GridView({
	projectId,
	externalFilters,
}: {
	projectId?: string;
	externalFilters?: Record<string, string[]>;
}) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject = projects.find((p) => p.id === projectId);

	const {
		tasks: sortedTasks,
		sortConfig,
		selectedTaskIds,
		isSelectionModeActive,
		handleSort,
		handleToggleSelectionMode,
		handleToggleSelect,
		handleClearSelection,
		warningModal,
		initiateBulkDelete,
		initiateBulkComplete,
		confirmWarningAction,
		closeWarningModal,
		confirmCopy,
	} = useGridView(projectId || "", externalFilters);

	const isSelectionActive = isSelectionModeActive || selectedTaskIds.size > 0;

	const viewColumns = useMemo(() => {
		return GRID_COLUMNS.map((col) => {
			if (col.key === "select") {
				return {
					...col,
					renderHeader: () => (
						<Checkbox
							aria-label="Toggle selection mode"
							checked={isSelectionActive}
							onCheckedChange={(checked) =>
								handleToggleSelectionMode(Boolean(checked))
							}
						/>
					),
				};
			}
			// All these columns sortable except select and assignee
			return { ...col, sortable: col.key !== "assignee" };
		});
	}, [isSelectionActive, handleToggleSelectionMode]);

	return (
		<div className="flex flex-col gap-6 w-full relative">
			<PageHeader
				title="Task Grid"
				description={`View and manage all tasks for ${currentProject?.title || "this project"} in a structured grid table.`}
			/>

			<GridTable
				data={sortedTasks}
				columns={viewColumns}
				sortConfig={sortConfig}
				onSort={handleSort}
				renderRow={(task) => (
					<GridRow
						task={task}
						projectId={projectId || ""}
						isSelected={selectedTaskIds.has(task.id)}
						isSelectionActive={isSelectionActive}
						onToggleSelect={(checked) => handleToggleSelect(task.id, checked)}
					/>
				)}
				renderFooter={() => <AddTaskRow />}
			/>

			<BulkActionBar
				selectedCount={selectedTaskIds.size}
				onClearSelection={handleClearSelection}
				onDelete={initiateBulkDelete}
				onComplete={initiateBulkComplete}
			/>

			{/* Wording comes from the hook, which is the only place that knows both
			    how many tasks are selected and whether any checklist is unfinished.
			    The kanban board renders the same dialog from the same source. */}
			<ConfirmDialog
				isOpen={warningModal.isOpen}
				onClose={closeWarningModal}
				onConfirm={confirmWarningAction}
				{...confirmCopy}
			/>
		</div>
	);
}
