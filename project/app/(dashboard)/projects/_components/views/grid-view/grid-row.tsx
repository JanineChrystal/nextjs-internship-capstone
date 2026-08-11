"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
	TASK_BOARDS,
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask } from "@/types/task";
import { BoardBadge } from "../../../../_components/ui/badges/board-badge";
import { PriorityBadge } from "../../../../_components/ui/badges/priority-badge";
import { StatusBadge } from "../../../../_components/ui/badges/status-badge";
import { TagBadge } from "../../../../_components/ui/badges/tag-badge";
import { GRID_COLUMN_CLASSES } from "../../../_constants/grid-view";
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

			<GridDateCell
				className={GRID_COLUMN_CLASSES.start}
				date={task.startDate}
				onSelect={(date) => updateTask(task.id, { startDate: date })}
			/>

			<GridDateCell
				className={GRID_COLUMN_CLASSES.due}
				date={task.dueDate}
				onSelect={(date) => updateTask(task.id, { dueDate: date })}
			/>

			<GridDropdownCell
				className={GRID_COLUMN_CLASSES.board}
				options={TASK_BOARDS}
				onSelect={(board) => updateTask(task.id, { board })}
			>
				<BoardBadge board={task.board} />
			</GridDropdownCell>

			<GridDropdownCell
				className={GRID_COLUMN_CLASSES.status}
				options={TASK_STATUSES}
				onSelect={(status) => updateTask(task.id, { status })}
			>
				<StatusBadge status={task.status} />
			</GridDropdownCell>

			<GridDropdownCell
				className={GRID_COLUMN_CLASSES.priority}
				options={TASK_PRIORITIES}
				onSelect={(priority) => updateTask(task.id, { priority })}
			>
				<PriorityBadge priority={task.priority} />
			</GridDropdownCell>

			<GridDropdownCell
				className={GRID_COLUMN_CLASSES.tag}
				options={TASK_TAGS}
				onSelect={(tag) => updateTask(task.id, { tag })}
			>
				<TagBadge tag={task.tag} />
			</GridDropdownCell>
		</>
	);
}
