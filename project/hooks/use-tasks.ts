"use client";

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import {
	type CreateTaskInput,
	createTaskAction,
	deleteTaskAction,
	getTasksAction,
	moveTaskAction,
	updateTaskAction,
} from "@/lib/actions/task-actions";
import type { TaskOutputDTO } from "@/lib/dtos/task-dto";
import type { updateTaskSchema } from "@/lib/validations/task-schema";

export function useTasks(projectId: string) {
	// Local State
	const [tasks, setTasks] = useState<TaskOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [isMoving, setIsMoving] = useState<boolean>(false);

	// Handlers & Callbacks
	const fetchTasks = useCallback(async () => {
		if (!projectId) return;
		setIsLoading(true);
		setError(null);
		try {
			const result = await getTasksAction(projectId);
			if (result.success && result.data) {
				setTasks(result.data);
			} else {
				setError(result.error || "Failed to fetch tasks");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unexpected error occurred",
			);
		} finally {
			setIsLoading(false);
		}
	}, [projectId]);

	const createTask = useCallback(
		async (data: CreateTaskInput, boardId = "default-board") => {
			setIsCreating(true);
			setError(null);
			try {
				const result = await createTaskAction(projectId, boardId, data);
				if (result.success && result.data) {
					setTasks((prev) => [result.data as TaskOutputDTO, ...prev]);
					return result.data;
				}
				setError(result.error || "Failed to create task");
				return null;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An unexpected error occurred",
				);
				return null;
			} finally {
				setIsCreating(false);
			}
		},
		[projectId],
	);

	const updateTask = useCallback(
		async (taskId: string, data: z.infer<typeof updateTaskSchema>) => {
			setIsUpdating(true);
			setError(null);
			try {
				const result = await updateTaskAction(taskId, projectId, data);
				if (result.success && result.data) {
					setTasks((prev) =>
						prev.map((t) =>
							t.id === taskId ? (result.data as TaskOutputDTO) : t,
						),
					);
					return result.data;
				}
				setError(result.error || "Failed to update task");
				return null;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An unexpected error occurred",
				);
				return null;
			} finally {
				setIsUpdating(false);
			}
		},
		[projectId],
	);

	const deleteTask = useCallback(
		async (taskId: string) => {
			setIsDeleting(true);
			setError(null);
			try {
				const result = await deleteTaskAction(taskId, projectId);
				if (result.success) {
					setTasks((prev) => prev.filter((t) => t.id !== taskId));
					return true;
				}
				setError(result.error || "Failed to delete task");
				return false;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An unexpected error occurred",
				);
				return false;
			} finally {
				setIsDeleting(false);
			}
		},
		[projectId],
	);

	const moveTask = useCallback(
		async (taskId: string, newBoardId: string) => {
			setIsMoving(true);
			setError(null);
			try {
				const result = await moveTaskAction(taskId, newBoardId, projectId);
				if (result.success && result.data) {
					setTasks((prev) =>
						prev.map((t) =>
							t.id === taskId ? (result.data as TaskOutputDTO) : t,
						),
					);
					return result.data;
				}
				setError(result.error || "Failed to move task");
				return null;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An unexpected error occurred",
				);
				return null;
			} finally {
				setIsMoving(false);
			}
		},
		[projectId],
	);

	// Effects
	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	// Return Statement
	return {
		tasks,
		isLoading,
		error,
		refetch: fetchTasks,
		createTask,
		updateTask,
		deleteTask,
		moveTask,
		isCreating,
		isUpdating,
		isDeleting,
		isMoving,
	};
}
