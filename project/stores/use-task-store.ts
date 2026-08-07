import { create } from "zustand";
import { MOCK_TASKS } from "@/app/(dashboard)/projects/_constants/grid-view-constants";
import type { GridTask } from "@/types/task";

interface TaskState {
	tasks: GridTask[];
	isTaskModalOpen: boolean;
	selectedTaskId: string | null;
	openTaskModal: (taskId?: string) => void;
	closeTaskModal: () => void;
	createTask: (task: Omit<GridTask, "id">) => void;
	updateTask: (id: string, updates: Partial<GridTask>) => void;
	deleteTask: (id: string) => void;
	duplicateTask: (id: string) => void;
	bulkDeleteTasks: (ids: Set<string>) => void;
	bulkCompleteTasks: (ids: Set<string>) => void;
	setTasks: (tasks: GridTask[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
	tasks: MOCK_TASKS,
	isTaskModalOpen: false,
	selectedTaskId: null,

	openTaskModal: (taskId) =>
		set({ isTaskModalOpen: true, selectedTaskId: taskId || null }),
	closeTaskModal: () => set({ isTaskModalOpen: false, selectedTaskId: null }),

	createTask: (taskData) =>
		set((state) => {
			const newTask: GridTask = {
				...taskData,
				id: crypto.randomUUID(),
			};
			return { tasks: [newTask, ...state.tasks] };
		}),

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

	duplicateTask: (id) =>
		set((state) => {
			const taskToDuplicate = state.tasks.find((t) => t.id === id);
			if (!taskToDuplicate) return state;

			// Logic to append (1), (2) etc.
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
					// Base exists, so at least 1 is needed
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

			// Insert duplicate right after original
			const index = state.tasks.findIndex((t) => t.id === id);
			const newTasks = [...state.tasks];
			newTasks.splice(index + 1, 0, duplicatedTask);

			return { tasks: newTasks };
		}),

	bulkDeleteTasks: (ids) =>
		set((state) => ({
			tasks: state.tasks.filter((task) => !ids.has(task.id)),
		})),

	bulkCompleteTasks: (ids) =>
		set((state) => ({
			tasks: state.tasks.map((task) =>
				ids.has(task.id)
					? {
							...task,
							isCompleted: true,
							status: "Completed",
							board: "Completed",
						}
					: task,
			),
		})),

	setTasks: (tasks) => set({ tasks }),
}));
