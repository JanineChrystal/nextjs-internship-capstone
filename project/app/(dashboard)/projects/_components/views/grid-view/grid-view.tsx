"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { GridTable } from "@/components/views/grid-table/grid-table";
import { useTaskStore } from "@/stores/use-task-store";
import { GRID_COLUMNS } from "../../../_constants/grid-view-constants";
import { AddTaskRow } from "./add-task-row";
import { BulkActionBar } from "./bulk-action-bar";
import { GridRow } from "./grid-row";

export function GridView() {
	const { tasks, bulkDeleteTasks, bulkCompleteTasks } = useTaskStore();

	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
		new Set(),
	);
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const isAllSelected =
		tasks.length > 0 && selectedTaskIds.size === tasks.length;
	const isIndeterminate =
		selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length;

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
		} else {
			setSelectedTaskIds(new Set());
		}
	};

	const handleSort = (key: string) => {
		setSortConfig((current) => {
			if (current?.key === key) {
				if (current.direction === "asc") return { key, direction: "desc" };
				return null; // Unsort
			}
			return { key, direction: "asc" };
		});
	};

	const sortedTasks = useMemo(() => {
		if (!sortConfig) return tasks;

		return [...tasks].sort((a, b) => {
			const aValue = a[sortConfig.key as keyof typeof a];
			const bValue = b[sortConfig.key as keyof typeof b];

			if (aValue === bValue) return 0;
			if (aValue === undefined || aValue === null) return 1;
			if (bValue === undefined || bValue === null) return -1;

			if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
			if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [tasks, sortConfig]);

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
		// Make all these columns sortable except select
		return { ...col, sortable: true };
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
						onToggleSelect={(checked) => {
							setSelectedTaskIds((prev) => {
								const next = new Set(prev);
								if (checked) next.add(task.id);
								else next.delete(task.id);
								return next;
							});
						}}
					/>
				)}
				renderFooter={() => <AddTaskRow />}
			/>

			<BulkActionBar
				selectedCount={selectedTaskIds.size}
				onClearSelection={() => setSelectedTaskIds(new Set())}
				onDelete={() => {
					bulkDeleteTasks(selectedTaskIds);
					setSelectedTaskIds(new Set());
				}}
				onComplete={() => {
					bulkCompleteTasks(selectedTaskIds);
					setSelectedTaskIds(new Set());
				}}
			/>
		</div>
	);
}
