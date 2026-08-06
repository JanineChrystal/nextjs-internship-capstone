"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { GridTable } from "@/components/views/grid-table/grid-table";
import {
	GRID_COLUMNS,
	MOCK_TASKS,
} from "../../../_constants/grid-view-constants";
import { AddTaskRow } from "./add-task-row";
import { GridRow } from "./grid-row";

export function GridView() {
	const viewColumns = GRID_COLUMNS.map((col) => {
		if (col.key === "select") {
			return {
				...col,
				renderHeader: () => <Checkbox aria-label="Select all" />,
			};
		}
		return col;
	});

	return (
		<div className="w-full mt-2">
			<GridTable
				data={MOCK_TASKS}
				columns={viewColumns}
				renderRow={(task) => <GridRow task={task} />}
				renderFooter={() => <AddTaskRow />}
			/>
		</div>
	);
}
