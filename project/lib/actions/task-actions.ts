"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { upsertProjectCategoryDAL } from "@/lib/dal/category-mutations";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import {
	bulkCompleteTasksInDB,
	bulkDeleteTasksInDB,
	createTaskInDB,
	deleteTaskInDB,
	getAllUserTasksDAL,
	getTasksByProjectId,
	moveTaskBoardDAL,
	reorderTasksInDB,
	updateTaskInDB,
} from "@/lib/dal/tasks";
import type {
	TaskOutputDTO,
	TaskWithBoardOutputDTO,
} from "@/lib/dtos/task-dto";
import type { CreateTaskInput, NewDbTask } from "@/lib/types/task";
import {
	bulkUpdateTaskStatusSchema,
	insertTaskDbSchema,
	moveTaskSchema,
	updateTaskSchema,
} from "@/lib/validations/task-schema";

export async function getTasksAction(
	projectId: string,
): Promise<{ success: boolean; data?: TaskOutputDTO[]; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const tasks = await getTasksByProjectId(projectId);
		return { success: true, data: tasks };
	} catch (error) {
		console.error("getTasksAction error:", error);
		return { success: false, error: "Failed to fetch tasks" };
	}
}

export async function getAllUserTasksAction(): Promise<{
	success: boolean;
	data?: TaskWithBoardOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const tasks = await getAllUserTasksDAL();
		return { success: true, data: tasks };
	} catch (error) {
		console.error("getAllUserTasksAction error:", error);
		return { success: false, error: "Failed to fetch tasks" };
	}
}

export async function createTaskAction(
	projectId: string,
	boardId: string,
	inputData: CreateTaskInput,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		// Auth & Permission check
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"create_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		// Category is optional for the user - fall back to "Uncategorized"
		// rather than storing an empty string.
		const categoryValue = inputData.category?.trim() || "Uncategorized";

		// Parse payload
		const rawData = {
			projectId,
			boardId,
			name: inputData.name,
			status: inputData.status,
			priority: inputData.priority,
			category: categoryValue,
			notes: inputData.notes,
			startDate: inputData.startDate
				? new Date(inputData.startDate)
				: undefined,
			dueDate: inputData.dueDate ? new Date(inputData.dueDate) : undefined,
		};

		// Zod Validation (Using the DB schema directly for raw backend inserts)
		const validationResult = insertTaskDbSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const validatedData = validationResult.data;

		// Register the category in the shared Categories table so it becomes a
		// reusable, styled option. Scoped to the project's workspace, not the
		// editor's, so a member styling a task in a shared project does not file
		// the category away in their own workspace where the owner never sees it.
		await upsertProjectCategoryDAL(projectId, categoryValue, "task");

		// DAL Call
		const newTask = await createTaskInDB(validatedData);

		// Cache Revalidation
		revalidatePath(`/projects/${projectId}`);

		// Return DTO Payload
		return { success: true, data: newTask };
	} catch (error) {
		console.error("createTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateTaskAction(
	taskId: string,
	projectId: string,
	inputData: z.infer<typeof updateTaskSchema>,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = updateTaskSchema.safeParse(inputData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid task data" };
		}

		if (validationResult.data.category?.trim()) {
			await upsertProjectCategoryDAL(
				projectId,
				validationResult.data.category.trim(),
				"task",
			);
		}

		const updatePayload: Partial<NewDbTask> = {
			name: validationResult.data.name,
			status: validationResult.data.status,
			priority: validationResult.data.priority,
			category: validationResult.data.category,
			notes: validationResult.data.notes,
			boardId: validationResult.data.boardId,
			previousBoardId: validationResult.data.previousBoardId,
			// Authoritative completion flag - previously validated then dropped,
			// which left completion state unsaved on single-task toggles.
			isCompleted: validationResult.data.isCompleted,
			statusOverriddenAt: validationResult.data.statusOverriddenAt
				? new Date(validationResult.data.statusOverriddenAt)
				: undefined,
			startDate: validationResult.data.startDate
				? new Date(validationResult.data.startDate)
				: undefined,
			dueDate: validationResult.data.dueDate
				? new Date(validationResult.data.dueDate)
				: undefined,
		};

		const updatedTask = await updateTaskInDB(taskId, projectId, updatePayload);

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: updatedTask };
	} catch (error) {
		console.error("updateTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteTaskAction(
	taskId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"delete_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await deleteTaskInDB(taskId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkDeleteTasksAction(
	taskIds: string[],
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"delete_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await bulkDeleteTasksInDB(taskIds, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("bulkDeleteTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkCompleteTasksAction(
	taskIds: string[],
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = bulkUpdateTaskStatusSchema.safeParse({
			taskIds,
			status: "Completed",
		});
		if (!validationResult.success) {
			return { success: false, error: "Invalid bulk complete data" };
		}

		await bulkCompleteTasksInDB(taskIds, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("bulkCompleteTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function moveTaskAction(
	taskId: string,
	newBoardId: string,
	projectId: string,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = moveTaskSchema.safeParse({ taskId, newBoardId });
		if (!validationResult.success) {
			return { success: false, error: "Invalid move data" };
		}

		const movedTask = await moveTaskBoardDAL(taskId, projectId, newBoardId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: movedTask };
	} catch (error) {
		console.error("moveTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function reorderTasksAction(
	projectId: string,
	boardId: string,
	taskIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await reorderTasksInDB(projectId, boardId, taskIds);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("reorderTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
