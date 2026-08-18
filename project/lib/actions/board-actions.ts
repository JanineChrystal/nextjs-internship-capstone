"use server";

import { revalidatePath } from "next/cache";
import { getSessionFailureReason } from "@/lib/dal/auth";
import {
	countTasksInBoardDAL,
	createBoardDAL,
	deleteBoardDAL,
	renameBoardDAL,
	reorderBoardsDAL,
	setCompletionBoardDAL,
} from "@/lib/dal/boards";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";

export async function reorderBoardsAction(
	projectId: string,
	boardIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_project",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await reorderBoardsDAL(projectId, boardIds);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("reorderBoardsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function createBoardAction(
	projectId: string,
	name: string,
): Promise<{
	success: boolean;
	data?: { id: string; name: string; position: number };
	error?: string;
}> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_boards",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const board = await createBoardDAL(projectId, name);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: board };
	} catch (error) {
		console.error("createBoardAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function renameBoardAction(
	boardId: string,
	projectId: string,
	newName: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_boards",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await renameBoardDAL(boardId, projectId, newName);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("renameBoardAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function getBoardTaskCountAction(
	boardId: string,
	projectId: string,
): Promise<{ success: boolean; count?: number; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"view_project",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const count = await countTasksInBoardDAL(boardId, projectId);
		return { success: true, count };
	} catch (error) {
		console.error("getBoardTaskCountAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function setCompletionBoardAction(
	boardId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_boards",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await setCompletionBoardDAL(boardId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("setCompletionBoardAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteBoardAction(
	boardId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_boards",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await deleteBoardDAL(boardId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteBoardAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
