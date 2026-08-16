import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useBoardMutations } from "./use-board-mutations";

export function useKanbanColumn(id: string, title: string) {
	const params = useParams();
	const projectId = params?.id as string;

	const {
		renameBoard,
		setCompletionBoard,
		initiateDeleteBoard,
		deleteWarning,
		confirmDeleteBoard,
		closeDeleteWarning,
	} = useBoardMutations(projectId);
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
			renameBoard(id, editTitle.trim());
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

	const deleteColumn = () => initiateDeleteBoard(id, title);
	const markAsCompletionColumn = () => setCompletionBoard(id);

	return {
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
	};
}
