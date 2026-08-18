"use client";
import { useMemo } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
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

			<WarningModal
				isOpen={warningModal.isOpen}
				onClose={closeWarningModal}
				onConfirm={confirmWarningAction}
				variant={warningModal.actionType === "delete" ? "danger" : "warning"}
				title={
					warningModal.actionType === "delete"
						? "Delete tasks with unfinished checklist items?"
						: "Complete tasks with unfinished checklist items?"
				}
				message={
					warningModal.actionType === "delete"
						? "One or more selected tasks still have unchecked checklist items. Deleting them will also remove those items."
						: "One or more selected tasks still have unchecked checklist items. Marking them complete won't check those items off."
				}
				confirmText={
					warningModal.actionType === "delete" ? "Delete" : "Complete"
				}
			/>
		</div>
	);
}
