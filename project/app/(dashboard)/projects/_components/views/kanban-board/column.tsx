"use client";

import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardStore } from "@/stores/board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask } from "@/types/task";
import { TaskCard } from "./task-card";

interface ColumnProps {
	id: string;
	title: string;
	dotColor: string;
	tasks: GridTask[];
}

export function Column({ id, title, dotColor, tasks }: ColumnProps) {
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

	const deleteColumn = useBoardStore((state) => state.deleteColumn);
	const renameColumn = useBoardStore((state) => state.renameColumn);
	const openTaskModal = useTaskStore((state) => state.openTaskModal);

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState(title);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditingTitle && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditingTitle]);

	const handleRenameSubmit = () => {
		if (editTitle.trim() && editTitle !== title) {
			renameColumn(id, editTitle.trim());
		} else {
			setEditTitle(title);
		}
		setIsEditingTitle(false);
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
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRenameSubmit();
								if (e.key === "Escape") {
									setEditTitle(title);
									setIsEditingTitle(false);
								}
								e.stopPropagation();
							}}
							onPointerDown={(e) => e.stopPropagation()}
							className="bg-transparent border-b border-primary outline-none focus:border-primary text-on-surface w-32"
						/>
					) : (
						<h3 className="flex items-center gap-2">
							{title}{" "}
							<span className="text-secondary ml-1">{tasks.length}</span>
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
						<DropdownMenuItem
							onPointerDown={(e) => e.stopPropagation()}
							onClick={() => setIsEditingTitle(true)}
						>
							<Edit2 className="w-4 h-4 mr-2" />
							Rename Board
						</DropdownMenuItem>
						<DropdownMenuItem
							onPointerDown={(e) => e.stopPropagation()}
							className="text-error focus:text-error focus:bg-error/10"
							onClick={() => deleteColumn(id)}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Delete Board
						</DropdownMenuItem>
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
				variant="outline"
				onClick={() => openTaskModal()}
				className="w-full py-2 flex items-center justify-center gap-2 text-foreground hover:bg-surface-variant rounded-lg transition-colors font-label-sm text-label-sm mt-2 border border-dashed border-outline-variant bg-transparent"
			>
				<Plus className="w-4.5 h-4.5" /> Add Tasks
			</Button>
		</div>
	);
}
