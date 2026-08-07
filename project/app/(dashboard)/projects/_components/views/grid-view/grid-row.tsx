"use client";

import {
	CheckCircle,
	Copy,
	Info,
	MoreHorizontal,
	PlusCircle,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/date";
import {
	TASK_BOARDS,
	TASK_PRIORITIES,
	TASK_STATUSES,
	TASK_TAGS,
} from "@/lib/validations/task-schema";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask } from "@/types/task";
import { gridColumnClasses } from "../../../_constants/grid-view-constants";
import { BoardBadge } from "../../ui/badges/board-badge";
import { PriorityBadge } from "../../ui/badges/priority-badge";
import { StatusBadge } from "../../ui/badges/status-badge";
import { TagBadge } from "../../ui/badges/tag-badge";

interface GridRowProps {
	task: GridTask;
	isSelected: boolean;
	onToggleSelect: (checked: boolean) => void;
}

export function GridRow({ task, isSelected, onToggleSelect }: GridRowProps) {
	const { updateTask, duplicateTask, deleteTask, openTaskModal } =
		useTaskStore();

	return (
		<>
			<div className={gridColumnClasses.checkbox}>
				<Checkbox
					checked={isSelected}
					onCheckedChange={(c) => onToggleSelect(c as boolean)}
				/>
			</div>

			<div
				className={`${gridColumnClasses.taskName} flex items-center justify-between group/name pr-4`}
			>
				<span className="font-medium text-sm text-foreground truncate mr-2">
					{task.name}
				</span>
				<div className="flex items-center opacity-0 group-hover/name:opacity-100 transition-opacity">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-secondary hover:text-foreground mr-1"
						onClick={() => openTaskModal(task.id)}
					>
						<Info className="h-4 w-4" />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-secondary hover:text-foreground"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								onClick={() =>
									updateTask(task.id, {
										isCompleted: true,
										status: "Completed",
										board: "Completed",
									})
								}
								className="text-green-600 dark:text-green-400"
							>
								<CheckCircle className="h-4 w-4 mr-2" />
								Mark as done
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => duplicateTask(task.id)}>
								<Copy className="h-4 w-4 mr-2" />
								Duplicate task
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => deleteTask(task.id)}
								className="text-error"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete task
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div
				className={`${gridColumnClasses.assignee} flex items-center gap-1 group/assignee`}
			>
				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none">
						<Image
							src={task.assignee.avatarUrl}
							alt={task.assignee.name}
							width={24}
							height={24}
							className="rounded-full bg-surface-variant border border-outline-variant/20 hover:ring-2 ring-primary/30 transition-all"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() =>
								updateTask(task.id, {
									assignee: {
										name: "Jane Doe",
										avatarUrl: "https://i.pravatar.cc/150?u=jane",
									},
								})
							}
						>
							Jane Doe
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 rounded-full text-secondary hover:text-foreground opacity-0 group-hover/assignee:opacity-100 transition-opacity"
					onClick={() => console.log("TODO: Add Assignee Modal")}
				>
					<PlusCircle className="h-4 w-4" />
				</Button>
			</div>

			<div className={gridColumnClasses.start}>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							className="h-8 px-2 text-sm text-secondary hover:text-foreground font-normal"
						>
							{formatDate(task.startDate)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={
								task.startDate && task.startDate !== "--"
									? new Date(task.startDate)
									: undefined
							}
							onSelect={(date) =>
								date && updateTask(task.id, { startDate: date.toISOString() })
							}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div className={gridColumnClasses.due}>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							className="h-8 px-2 text-sm text-secondary hover:text-foreground font-normal"
						>
							{formatDate(task.dueDate)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={
								task.dueDate && task.dueDate !== "--"
									? new Date(task.dueDate)
									: undefined
							}
							onSelect={(date) =>
								date && updateTask(task.id, { dueDate: date.toISOString() })
							}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div className={gridColumnClasses.board}>
				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none rounded-md hover:ring-2 ring-primary/30 transition-all">
						<BoardBadge board={task.board} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						{TASK_BOARDS.map((b) => (
							<DropdownMenuItem
								key={b}
								onClick={() => updateTask(task.id, { board: b })}
							>
								{b}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className={gridColumnClasses.status}>
				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none rounded-md hover:ring-2 ring-primary/30 transition-all">
						<StatusBadge status={task.status} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						{TASK_STATUSES.map((s) => (
							<DropdownMenuItem
								key={s}
								onClick={() => updateTask(task.id, { status: s })}
							>
								{s}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className={gridColumnClasses.priority}>
				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none rounded-md hover:ring-2 ring-primary/30 transition-all">
						<PriorityBadge priority={task.priority} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						{TASK_PRIORITIES.map((p) => (
							<DropdownMenuItem
								key={p}
								onClick={() => updateTask(task.id, { priority: p })}
							>
								{p}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className={gridColumnClasses.tag}>
				<DropdownMenu>
					<DropdownMenuTrigger className="focus:outline-none rounded-md hover:ring-2 ring-primary/30 transition-all">
						<TagBadge tag={task.tag} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						{TASK_TAGS.map((t) => (
							<DropdownMenuItem
								key={t}
								onClick={() => updateTask(task.id, { tag: t })}
							>
								{t}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</>
	);
}
