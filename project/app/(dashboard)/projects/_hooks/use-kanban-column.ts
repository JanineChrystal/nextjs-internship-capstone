import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";

export function useKanbanColumn(id: string, title: string) {
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

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleRenameSubmit();
		if (e.key === "Escape") {
			setEditTitle(title);
			setIsEditingTitle(false);
		}
		e.stopPropagation();
	};

	return {
		isEditingTitle,
		editTitle,
		inputRef,
		setEditTitle,
		setIsEditingTitle,
		handleRenameSubmit,
		handleKeyDown,
		deleteColumn,
		openTaskModal,
	};
}
