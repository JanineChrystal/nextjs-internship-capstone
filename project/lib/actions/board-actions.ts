"use server";

import { revalidatePath } from "next/cache";
import { reorderBoardsDAL } from "@/lib/dal/boards";
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
			return { success: false, error: "Unauthorized" };
		}

		await reorderBoardsDAL(projectId, boardIds);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("reorderBoardsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
