"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { GridTable } from "@/components/views/grid-table/grid-table";
import { GRID_COLUMNS } from "../../../_constants/grid-view-constants";
import { useGridView } from "../../../_hooks/use-grid-view";
import { AddTaskRow } from "./add-task-row";
import { BulkActionBar } from "./bulk-action-bar";
import { GridRow } from "./grid-row";

export function GridView() {
	const {
		tasks: sortedTasks,
		sortConfig,
		selectedTaskIds,
		isAllSelected,
		isIndeterminate,
		handleSort,
		handleSelectAll,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
	} = useGridView();

	const viewColumns = GRID_COLUMNS.map((col) => {
		if (col.key === "select") {
			return {
				...col,
				renderHeader: () => (
					<Checkbox
						aria-label="Select all"
						checked={isAllSelected || (isIndeterminate && "indeterminate")}
						onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
					/>
				),
			};
		}
		// All these columns sortable except select and assignee
		return { ...col, sortable: col.key !== "assignee" };
	});

	return (
		<div className="w-full mt-2 relative">
			<GridTable
				data={sortedTasks}
				columns={viewColumns}
				sortConfig={sortConfig}
				onSort={handleSort}
				renderRow={(task) => (
					<GridRow
						task={task}
						isSelected={selectedTaskIds.has(task.id)}
						onToggleSelect={(checked) => handleToggleSelect(task.id, checked)}
					/>
				)}
				renderFooter={() => <AddTaskRow />}
			/>

			<BulkActionBar
				selectedCount={selectedTaskIds.size}
				onClearSelection={handleClearSelection}
				onDelete={handleBulkDelete}
				onComplete={handleBulkComplete}
			/>
		</div>
	);
}
