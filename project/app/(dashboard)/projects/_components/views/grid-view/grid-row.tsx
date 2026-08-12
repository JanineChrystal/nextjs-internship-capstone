"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskPriority, TaskStatus, TaskTag } from "@/types/task";
import { PriorityBadge } from "../../../../_components/ui/badges/priority-badge";
import { StatusBadge } from "../../../../_components/ui/badges/status-badge";
import { TagBadge } from "../../../../_components/ui/badges/tag-badge";
import {
	GRID_COLUMN_CLASSES,
	GRID_DATE_CELLS,
	GRID_DROPDOWN_CELLS,
} from "../../../_constants/grid-view";
import {
	GridAssigneeCell,
	GridDateCell,
	GridDropdownCell,
	GridNameCell,
} from "./cells";

interface GridRowProps {
	task: GridTask;
	isSelected: boolean;
	isSelectionActive?: boolean;
	onToggleSelect: (checked: boolean) => void;
}

export function GridRow({
	task,
	isSelected,
	isSelectionActive,
	onToggleSelect,
}: GridRowProps) {
	const { updateTask } = useTaskStore();
	const boardColumns = useBoardStore((state) => state.columns);

	const dynamicStatuses = useMemo(
		() => boardColumns.map((col) => col.title),
		[boardColumns],
	);

	const renderBadge = (id: string, value: string) => {
		switch (id) {
			case "status":
				return <StatusBadge status={value as TaskStatus} />;
			case "priority":
				return <PriorityBadge priority={value as TaskPriority} />;
			case "tag":
				return <TagBadge tag={value as TaskTag} />;
			default:
				return null;
		}
	};

	return (
		<>
			<div className={GRID_COLUMN_CLASSES.checkbox}>
				<Checkbox
					checked={isSelected}
					onCheckedChange={(c) => onToggleSelect(c as boolean)}
					className={cn(
						"transition-opacity duration-150",
						isSelected || isSelectionActive
							? "opacity-100"
							: "opacity-0 pointer-events-none",
					)}
				/>
			</div>

			<GridNameCell
				className={GRID_COLUMN_CLASSES.taskName}
				taskId={task.id}
				taskName={task.name}
			/>

			<GridAssigneeCell
				className={GRID_COLUMN_CLASSES.assignee}
				assignees={task.assignees}
				onAssigneesChange={(newAssignees) =>
					updateTask(task.id, { assignees: newAssignees })
				}
			/>

			{GRID_DATE_CELLS.map((cell) => (
				<GridDateCell
					key={cell.id}
					className={cell.className}
					date={task[cell.id]}
					onSelect={(date) => updateTask(task.id, { [cell.id]: date })}
				/>
			))}

			{GRID_DROPDOWN_CELLS.map((cell) => (
				<GridDropdownCell
					key={cell.id}
					className={cell.className}
					options={cell.id === "status" ? dynamicStatuses : cell.options || []}
					onSelect={(value) => {
						const updates: Partial<GridTask> = { [cell.id]: value };
						if (cell.id === "status") {
							updates.board = value;
						}
						updateTask(task.id, updates);
					}}
				>
					{renderBadge(cell.id, task[cell.id] as string)}
				</GridDropdownCell>
			))}
		</>
	);
}
