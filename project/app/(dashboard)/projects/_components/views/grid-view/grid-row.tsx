"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { updateTaskAction } from "@/lib/actions/task-actions";
import { setTaskAssigneesAction } from "@/lib/actions/task-assignee-actions";
import { cn } from "@/lib/utils";
import { reportActionError } from "@/lib/utils/toast";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskPriority, TaskStatus } from "@/types/task";
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
	projectId: string;
	isSelected: boolean;
	isSelectionActive?: boolean;
	onToggleSelect: (checked: boolean) => void;
}

export function GridRow({
	task,
	projectId,
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

	const persistUpdate = async (updates: Partial<GridTask>) => {
		if (!projectId) return;
		const previousTasks = useTaskStore.getState().tasks;
		updateTask(task.id, updates);

		try {
			const boardId = updates.board
				? boardColumns.find((c) => c.title === updates.board)?.id
				: undefined;
			const result = await updateTaskAction(task.id, projectId, {
				status: updates.status,
				priority: updates.priority,
				category: updates.category,
				boardId,
				startDate: updates.startDate,
				dueDate: updates.dueDate,
			});
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not update task", error);
		}
	};

	const persistAssignees = async (newAssignees: GridTask["assignees"]) => {
		if (!projectId) return;
		const previousTasks = useTaskStore.getState().tasks;
		updateTask(task.id, { assignees: newAssignees });

		try {
			const result = await setTaskAssigneesAction(
				task.id,
				projectId,
				newAssignees.map((a) => a.userId),
			);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not update assignees", error);
		}
	};

	const renderBadge = (id: string, value: string) => {
		switch (id) {
			case "status":
				return <StatusBadge status={value as TaskStatus} />;
			case "priority":
				return <PriorityBadge priority={value as TaskPriority} />;
			case "category":
			case "tag":
				return <TagBadge tag={value} />;
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
				onAssigneesChange={(newAssignees) => persistAssignees(newAssignees)}
			/>

			{GRID_DATE_CELLS.map((cell) => (
				<GridDateCell
					key={cell.id}
					className={cell.className}
					date={task[cell.id]}
					onSelect={(date) => persistUpdate({ [cell.id]: date })}
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
						persistUpdate(updates);
					}}
				>
					{renderBadge(cell.id, task[cell.id] as string)}
				</GridDropdownCell>
			))}
		</>
	);
}
