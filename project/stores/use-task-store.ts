import { create } from "zustand";
import type { GridTask } from "@/types/task";
import { useBoardStore } from "./use-board-store";

interface TaskState {
	tasks: GridTask[];
	isTaskModalOpen: boolean;
	selectedTaskId: string | null;
	selectedTaskIds: Set<string>;
	createBoardTitle: string | null;
	createDate: Date | null;
	/**
	 * Which project the modal was opened for, when the opener is not on that
	 * project's page.
	 *
	 * The task modal normally reads the project from the route. That works
	 * everywhere it has ever been opened from - the board, the grid, the
	 * calendar - because all of those live under /projects/[id]. The dashboard's
	 * "Create Task" shortcut does not, so it passes the project here instead.
	 *
	 * It sits beside createBoardTitle and createDate because it is the same kind
	 * of thing: context the opener knows and the modal cannot work out for
	 * itself. Threading it as a prop instead would mean passing it through the
	 * modal, the properties grid and the assignee picker, none of which are
	 * otherwise related.
	 */
	createProjectId: string | null;
	openTaskModal: (
		taskId?: string,
		options?: { board?: string; date?: Date; projectId?: string },
	) => void;
	closeTaskModal: () => void;
	createTask: (task: GridTask) => void;
	updateTask: (id: string, updates: Partial<GridTask>) => void;
	deleteTask: (id: string) => void;
	duplicateTask: (id: string) => string | undefined;
	bulkDeleteTasks: (ids: Set<string>) => void;
	bulkCompleteTasks: (ids: Set<string>) => void;
	setTasks: (tasks: GridTask[]) => void;
	toggleTaskSelection: (taskId: string) => void;
	clearTaskSelection: () => void;
	updateTaskStatus: (taskId: string, newStatus: string) => void;
	moveTaskToColumn: (taskId: string, targetColumnId: string) => void;
	reorderTasksInColumn: (orderedTaskIds: string[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
	tasks: [],
	isTaskModalOpen: false,
	selectedTaskId: null,
	selectedTaskIds: new Set<string>(),
	createBoardTitle: null,
	createDate: null,
	createProjectId: null,

	openTaskModal: (taskId, options) =>
		set({
			isTaskModalOpen: true,
			selectedTaskId: taskId || null,
			createBoardTitle: options?.board || null,
			createDate: options?.date || null,
			createProjectId: options?.projectId || null,
		}),
	/** context teardown - clears modal context on close so a dashboard-selected project doesn't leak into subsequent modals opened elsewhere. */
	closeTaskModal: () =>
		set({
			isTaskModalOpen: false,
			selectedTaskId: null,
			createBoardTitle: null,
			createDate: null,
			createProjectId: null,
		}),

	createTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

	updateTask: (id, updates) =>
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === id ? { ...task, ...updates } : task,
			),
		})),

	deleteTask: (id) =>
		set((state) => ({
			tasks: state.tasks.filter((task) => task.id !== id),
		})),

	duplicateTask: (id) => {
		let newTaskId: string | undefined;

		set((state) => {
			const taskToDuplicate = state.tasks.find((t) => t.id === id);
			if (!taskToDuplicate) return state;

			/** duplication sequence - logic to append sequential numbers like (1), (2) to duplicated task names. */
			const baseName = taskToDuplicate.name.replace(/\s\(\d+\)$/, "");
			const similarTasks = state.tasks.filter((t) =>
				t.name.startsWith(baseName),
			);

			let nextIndex = 1;
			const regex = new RegExp(
				`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s\\((\\d+)\\)$`,
			);

			for (const t of similarTasks) {
				if (t.name === baseName) {
					/** base collision - the original name exists without a suffix, so the next duplicate must be at least index 1. */
					if (nextIndex < 1) nextIndex = 1;
				} else {
					const match = t.name.match(regex);
					if (match) {
						const num = parseInt(match[1], 10);
						if (num >= nextIndex) {
							nextIndex = num + 1;
						}
					}
				}
			}

			const newName = `${baseName} (${nextIndex})`;

			const duplicatedTask: GridTask = {
				...taskToDuplicate,
				id: crypto.randomUUID(),
				name: newName,
			};
			newTaskId = duplicatedTask.id;

			/** adjacency insertion - inserts the duplicated task immediately following its original in the list. */
			const index = state.tasks.findIndex((t) => t.id === id);
			const newTasks = [...state.tasks];
			newTasks.splice(index + 1, 0, duplicatedTask);

			return { tasks: newTasks };
		});

		return newTaskId;
	},

	bulkDeleteTasks: (ids) =>
		set((state) => ({
			tasks: state.tasks.filter((task) => !ids.has(task.id)),
			selectedTaskIds: new Set(),
		})),

	bulkCompleteTasks: (ids) =>
		set((state) => {
			/** completion routing - moves tasks to the designated completion column if one exists, otherwise just flags them in place. */
			const completionColumn = useBoardStore
				.getState()
				.columns.find((col) => col.isCompletionBoard);

			return {
				tasks: state.tasks.map((task) =>
					ids.has(task.id)
						? {
								...task,
								isCompleted: true,
								status: "Completed",
								...(completionColumn ? { board: completionColumn.title } : {}),
							}
						: task,
				),
				selectedTaskIds: new Set(),
			};
		}),

	setTasks: (tasks) => set({ tasks }),

	toggleTaskSelection: (taskId) =>
		set((state) => {
			const newSelected = new Set(state.selectedTaskIds);
			if (newSelected.has(taskId)) {
				newSelected.delete(taskId);
			} else {
				newSelected.add(taskId);
			}
			return { selectedTaskIds: newSelected };
		}),

	clearTaskSelection: () => set({ selectedTaskIds: new Set() }),

	updateTaskStatus: (taskId, newStatus) =>
		set((state) => {
			const boardColumns = useBoardStore.getState().columns;
			const targetColumn = boardColumns.find(
				(col) => col.title.toLowerCase() === newStatus.toLowerCase(),
			);

			return {
				tasks: state.tasks.map((task) =>
					task.id === taskId
						? {
								...task,
								status: newStatus,
								board: targetColumn?.title || newStatus,
							}
						: task,
				),
			};
		}),

	/** column assignment - updates only the board assignment on drag since status is tracked independently and shouldn't be overwritten. */
	moveTaskToColumn: (taskId, targetBoardTitle) =>
		set((state) => ({
			tasks: state.tasks.map((task) =>
				task.id === taskId ? { ...task, board: targetBoardTitle } : task,
			),
		})),

	reorderTasksInColumn: (orderedTaskIds) =>
		set((state) => {
			const orderIndex = new Map(orderedTaskIds.map((id, idx) => [id, idx]));
			const reorderedGroup = state.tasks
				.filter((t) => orderIndex.has(t.id))
				.sort(
					(a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
				);

			let groupIndex = 0;
			const tasks = state.tasks.map((task) =>
				orderIndex.has(task.id) ? reorderedGroup[groupIndex++] : task,
			);

			return { tasks };
		}),
}));
