"use client";

import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import type { GridTask } from "@/types/task";
import { gridColumnClasses } from "../../../_constants/grid-view-constants";
import { BoardBadge } from "../../ui/badges/board-badge";
import { PriorityBadge } from "../../ui/badges/priority-badge";
import { StatusBadge } from "../../ui/badges/status-badge";
import { TagBadge } from "../../ui/badges/tag-badge";

interface GridRowProps {
	task: GridTask;
}

export function GridRow({ task }: GridRowProps) {
	return (
		<>
			<div className={gridColumnClasses.checkbox}>
				<Checkbox checked={task.isCompleted} />
			</div>

			<div className={gridColumnClasses.taskName}>
				<span className="font-medium text-sm text-foreground">{task.name}</span>
			</div>

			<div className={gridColumnClasses.assignee}>
				<Image
					src={task.assignee.avatarUrl}
					alt={task.assignee.name}
					width={24}
					height={24}
					className="rounded-full bg-surface-variant border border-outline-variant/20"
				/>
			</div>

			<div className={gridColumnClasses.start}>
				<span className="text-sm text-secondary">{task.startDate || "--"}</span>
			</div>

			<div className={gridColumnClasses.due}>
				<span className="text-sm text-secondary">{task.dueDate || "--"}</span>
			</div>

			<div className={gridColumnClasses.board}>
				<BoardBadge board={task.board} />
			</div>

			<div className={gridColumnClasses.status}>
				<StatusBadge status={task.status} />
			</div>

			<div className={gridColumnClasses.priority}>
				<PriorityBadge priority={task.priority} />
			</div>

			<div className={gridColumnClasses.tag}>
				<TagBadge tag={task.tag} />
			</div>
		</>
	);
}
