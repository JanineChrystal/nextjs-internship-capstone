import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { defaultColumns } from "@/constants/board";
import type { BoardColumn } from "@/types/board";
import { useTaskStore } from "./use-task-store";

interface BoardState {
	columns: BoardColumn[];
	addColumn: (title: string) => void;
	reorderColumns: (activeId: string, overId: string) => void;
	deleteColumn: (id: string, fallbackColumnId?: string) => void;
	renameColumn: (id: string, newTitle: string) => void;
	setColumns: (columns: BoardColumn[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
	columns: defaultColumns,

	addColumn: (title: string) =>
		set((state) => {
			const newColumn: BoardColumn = {
				id: title.toLowerCase().replace(/\s+/g, "-"),
				title,
				dotColor: "bg-primary",
				order: state.columns.length,
			};
			return { columns: [...state.columns, newColumn] };
		}),

	reorderColumns: (activeId: string, overId: string) =>
		set((state) => {
			const oldIndex = state.columns.findIndex((col) => col.id === activeId);
			const newIndex = state.columns.findIndex((col) => col.id === overId);

			if (oldIndex === -1 || newIndex === -1) return state;

			const newColumns = arrayMove(state.columns, oldIndex, newIndex).map(
				(col, index) => ({ ...col, order: index }),
			);

			return { columns: newColumns };
		}),

	deleteColumn: (id: string, fallbackColumnId?: string) =>
		set((state) => {
			// Find fallback: either provided, or the first column that isn't the one being deleted
			const fallback = fallbackColumnId
				? state.columns.find((c) => c.id === fallbackColumnId)
				: state.columns.find((c) => c.id !== id);

			if (fallback) {
				const tasksStore = useTaskStore.getState();
				const tasksInColumn = tasksStore.tasks.filter((t) => t.board === id);

				tasksInColumn.forEach((task) => {
					tasksStore.updateTask(task.id, {
						board: fallback.title,
						status: fallback.title,
					});
				});
			}

			const remainingColumns = state.columns
				.filter((col) => col.id !== id)
				.map((col, index) => ({ ...col, order: index }));

			return { columns: remainingColumns };
		}),

	renameColumn: (id: string, newTitle: string) =>
		set((state) => {
			const oldCol = state.columns.find((c) => c.id === id);
			if (oldCol && oldCol.title !== newTitle) {
				const tasksStore = useTaskStore.getState();
				const tasksInColumn = tasksStore.tasks.filter(
					(t) => t.board === oldCol.title || t.status === oldCol.title,
				);
				tasksInColumn.forEach((task) => {
					tasksStore.updateTask(task.id, { board: newTitle, status: newTitle });
				});
			}
			return {
				columns: state.columns.map((col) =>
					col.id === id ? { ...col, title: newTitle } : col,
				),
			};
		}),

	setColumns: (columns: BoardColumn[]) => set({ columns }),
}));
