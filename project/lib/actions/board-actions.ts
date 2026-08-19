"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	countTasksInBoardDAL,
	createBoardDAL,
	deleteBoardDAL,
	getProjectBoardsDAL,
	renameBoardDAL,
	reorderBoardsDAL,
	setCompletionBoardDAL,
} from "@/lib/dal/boards";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
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

		const user = await getCurrentUser();
		if (user) {
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "BOARD_CREATED",
				details: `Created board "${board.name}"`,
				projectId,
			});
		}

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

		const user = await getCurrentUser();
		if (user) {
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "BOARD_DELETED",
				details: "Deleted a board",
				projectId,
			});
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteBoardAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/**
 * A project's board columns, for a caller that is not on the project page.
 *
 * The project page loads its own boards on the server and pushes them into the
 * board store, so nothing needed to read them from the browser until now. The
 * dashboard's "Create Task" shortcut does: it has to know which columns exist
 * before the task modal can decide where a new task goes.
 *
 * Gated on view_project rather than left open, because the column names are
 * project content - they describe how a team works.
 */
export async function getProjectBoardsAction(projectId: string): Promise<{
	success: boolean;
	data?: {
		id: string;
		name: string;
		position: number;
		isCompletionBoard: boolean;
	}[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const allowed = await verifyProjectPermissionDAL(projectId, "view_project");
		if (!allowed)
			return {
				success: false,
				error: "You do not have access to that project",
			};

		const boards = await getProjectBoardsDAL(projectId);
		return {
			success: true,
			data: boards.map((board) => ({
				id: board.id,
				name: board.name,
				position: board.position,
				isCompletionBoard: board.isCompletionBoard,
			})),
		};
	} catch (error) {
		console.error("getProjectBoardsAction error:", error);
		return { success: false, error: "Could not load the project's columns" };
	}
}
