import { create } from "zustand";
import { MOCK_TASKS } from "@/app/(dashboard)/projects/_constants/grid-view-constants";
import type { GridTask } from "@/types/task";

interface TaskState {
	tasks: GridTask[];
	updateTask: (id: string, updates: Partial<GridTask>) => void;
	deleteTask: (id: string) => void;
	duplicateTask: (id: string) => void;
	bulkDeleteTasks: (ids: Set<string>) => void;
	bulkCompleteTasks: (ids: Set<string>) => void;
	setTasks: (tasks: GridTask[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
	tasks: MOCK_TASKS,

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

			const duplicatedTask: GridTask = {
				...taskToDuplicate,
				id: crypto.randomUUID(),
				name: `${taskToDuplicate.name} (Copy)`,
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
