import { useState } from "react";
import {
	createBoardAction,
	deleteBoardAction,
	getBoardTaskCountAction,
	renameBoardAction,
	setCompletionBoardAction,
} from "@/lib/actions/board-actions";
import { reportActionError } from "@/lib/utils/toast";
import { useBoardStore } from "@/stores/use-board-store";

export function useBoardMutations(projectId: string) {
	const addColumnLocal = useBoardStore((state) => state.addColumn);
	const renameColumnLocal = useBoardStore((state) => state.renameColumn);
	const deleteColumnLocal = useBoardStore((state) => state.deleteColumn);

	const [deleteWarning, setDeleteWarning] = useState<{
		isOpen: boolean;
		boardId: string | null;
		boardTitle: string;
		taskCount: number;
	}>({ isOpen: false, boardId: null, boardTitle: "", taskCount: 0 });

	const createBoard = async (title: string) => {
		const previousColumns = useBoardStore.getState().columns;
		addColumnLocal(title);

		try {
			const result = await createBoardAction(projectId, title);
			if (!result.success || !result.data) throw new Error(result.error);
			const newBoardId = result.data.id;

			// Swap the locally-generated slug id for the real server id so
			// subsequent rename/delete/drag operations target a real board.
			const localId = title.toLowerCase().replace(/\s+/g, "-");
			const newColumns = useBoardStore
				.getState()
				.columns.map((c) =>
					c.id === localId && c.title === title ? { ...c, id: newBoardId } : c,
				);
			useBoardStore.getState().setColumns(newColumns);
		} catch (error) {
			useBoardStore.getState().setColumns(previousColumns);
			reportActionError("Could not create board column", error);
		}
	};

	const renameBoard = async (boardId: string, newTitle: string) => {
		const previousColumns = useBoardStore.getState().columns;
		renameColumnLocal(boardId, newTitle);

		try {
			const result = await renameBoardAction(boardId, projectId, newTitle);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useBoardStore.getState().setColumns(previousColumns);
			reportActionError("Could not rename board column", error);
		}
	};

	// Only one column per project may be the completion target, so the flag is
	// cleared everywhere else locally to mirror what the server does.
	const setCompletionBoard = async (boardId: string) => {
		const previousColumns = useBoardStore.getState().columns;

		useBoardStore.getState().setColumns(
			previousColumns.map((col) => ({
				...col,
				isCompletionBoard: col.id === boardId,
				dotColor: col.id === boardId ? "bg-success" : "bg-primary",
			})),
		);

		try {
			const result = await setCompletionBoardAction(boardId, projectId);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useBoardStore.getState().setColumns(previousColumns);
			reportActionError("Could not set the completion column", error);
		}
	};

	const executeDeleteBoard = async (boardId: string) => {
		const previousColumns = useBoardStore.getState().columns;
		deleteColumnLocal(boardId);

		try {
			const result = await deleteBoardAction(boardId, projectId);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useBoardStore.getState().setColumns(previousColumns);
			reportActionError("Could not delete board column", error);
		}
	};

	const initiateDeleteBoard = async (boardId: string, boardTitle: string) => {
		const result = await getBoardTaskCountAction(boardId, projectId);
		const taskCount = result.success ? (result.count ?? 0) : 0;

		if (taskCount > 0) {
			setDeleteWarning({ isOpen: true, boardId, boardTitle, taskCount });
		} else {
			await executeDeleteBoard(boardId);
		}
	};

	const confirmDeleteBoard = async () => {
		const { boardId } = deleteWarning;
		if (!boardId) return;
		setDeleteWarning({
			isOpen: false,
			boardId: null,
			boardTitle: "",
			taskCount: 0,
		});
		await executeDeleteBoard(boardId);
	};

	const closeDeleteWarning = () =>
		setDeleteWarning({
			isOpen: false,
			boardId: null,
			boardTitle: "",
			taskCount: 0,
		});

	return {
		createBoard,
		renameBoard,
		setCompletionBoard,
		initiateDeleteBoard,
		deleteWarning,
		confirmDeleteBoard,
		closeDeleteWarning,
	};
}
