import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { useTaskStore } from "./use-task-store";

export interface BoardColumn {
	id: string;
	title: string;
	dotColor: string;
	order: number;
}

interface BoardState {
	columns: BoardColumn[];
	addColumn: (title: string) => void;
	reorderColumns: (activeId: string, overId: string) => void;
	deleteColumn: (id: string, fallbackColumnId?: string) => void;
	renameColumn: (id: string, newTitle: string) => void;
}

const defaultColumns: BoardColumn[] = [
	{ id: "backlog", title: "Backlog", dotColor: "bg-secondary", order: 0 },
	{ id: "to-do", title: "To Do", dotColor: "bg-surface-tint", order: 1 },
	{ id: "in-progress", title: "In Progress", dotColor: "bg-primary", order: 2 },
	{ id: "completed", title: "Completed", dotColor: "bg-success", order: 3 },
];

export const useBoardStore = create<BoardState>((set, get) => ({
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
}));
