"use client";

import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, MoreHorizontal, Plus } from "lucide-react";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { Button } from "@/components/ui/buttons/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GridTask } from "@/types/task";
import { COLUMN_DROPDOWN_ACTIONS } from "../../../_constants/kanban";
import { useKanbanColumn } from "../../../_hooks/use-kanban-column";
import { TaskCard } from "./task-card";

interface ColumnProps {
	id: string;
	title: string;
	dotColor: string;
	tasks: GridTask[];
	isCompletionBoard?: boolean;
}

export function Column({
	id,
	title,
	dotColor,
	tasks,
	isCompletionBoard,
}: ColumnProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		data: { type: "Column", columnId: id },
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const {
		isEditingTitle,
		editTitle,
		inputRef,
		setEditTitle,
		setIsEditingTitle,
		handleRenameSubmit,
		handleKeyDown,
		deleteColumn,
		markAsCompletionColumn,
		deleteWarning,
		confirmDeleteBoard,
		closeDeleteWarning,
		openTaskModal,
	} = useKanbanColumn(id, title);

	const handleAction = (actionId: string) => {
		switch (actionId) {
			case "rename":
				setIsEditingTitle(true);
				break;
			case "set-completion":
				markAsCompletionColumn();
				break;
			case "delete":
				deleteColumn();
				break;
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={`shrink-0 w-80 flex flex-col gap-stack-md bg-surface-container-lowest border border-outline-variant rounded-xl p-4 h-full shadow-sm transition-colors ${
				isDragging ? "opacity-50 ring-2 ring-primary/50" : ""
			}`}
		>
			<div
				className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing"
				{...listeners}
			>
				<div className="font-label-md text-label-md text-on-surface flex items-center gap-2">
					<span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
					{isEditingTitle ? (
						<input
							ref={inputRef}
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							onBlur={handleRenameSubmit}
							onKeyDown={handleKeyDown}
							onPointerDown={(e) => e.stopPropagation()}
							className="bg-transparent border-b border-primary outline-none focus:border-primary text-on-surface w-32"
						/>
					) : (
						<h3 className="flex items-center gap-2">
							{title}{" "}
							<span className="text-secondary ml-1">{tasks.length}</span>
							{isCompletionBoard && (
								<span
									className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20"
									title="Completed tasks are moved into this column"
								>
									<CheckCircle2 className="w-2.5 h-2.5" /> Done
								</span>
							)}
						</h3>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-secondary hover:text-on-surface transition-colors"
						>
							<MoreHorizontal className="w-5 h-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{COLUMN_DROPDOWN_ACTIONS.map((action) => {
							const Icon = action.icon;
							return (
								<DropdownMenuItem
									key={action.id}
									onPointerDown={(e) => e.stopPropagation()}
									onClick={() => handleAction(action.id)}
									className={
										action.variant === "danger"
											? "text-error focus:text-error focus:bg-error/10"
											: ""
									}
								>
									<Icon className="w-4 h-4 mr-2" />
									{action.label}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-37.5">
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					{tasks.map((task) => (
						<TaskCard key={task.id} task={task} />
					))}
				</SortableContext>
			</div>

			<Button
				type="button"
				variant="outline"
				onClick={() => openTaskModal(undefined, { board: title })}
				className="w-full py-2 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-lg transition-colors font-label-sm text-label-sm mt-2 border border-dashed border-outline-variant bg-transparent"
			>
				<Plus className="w-4.5 h-4.5" /> Add Tasks
			</Button>

			<WarningModal
				isOpen={deleteWarning.isOpen}
				onClose={closeDeleteWarning}
				onConfirm={confirmDeleteBoard}
				variant="danger"
				title={`Delete "${deleteWarning.boardTitle}" board?`}
				message={`This board still has ${deleteWarning.taskCount} task${
					deleteWarning.taskCount === 1 ? "" : "s"
				}. Deleting it will move ${
					deleteWarning.taskCount === 1 ? "that task" : "those tasks"
				} to trash.`}
				confirmText="Delete"
			/>
		</div>
	);
}
