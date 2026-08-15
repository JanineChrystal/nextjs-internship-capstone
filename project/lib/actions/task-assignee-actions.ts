"use server";

import { revalidatePath } from "next/cache";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import {
	getProjectMembersDAL,
	type ProjectMemberOutputDTO,
} from "@/lib/dal/projects";
import { setTaskAssigneesInDB } from "@/lib/dal/task-assignees";

export async function getProjectMembersAction(projectId: string): Promise<{
	success: boolean;
	data?: ProjectMemberOutputDTO[];
	error?: string;
}> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"view_project",
		);
		if (!hasPermission) {
			return { success: false, error: "Unauthorized" };
		}

		const members = await getProjectMembersDAL(projectId);
		return { success: true, data: members };
	} catch (error) {
		console.error("getProjectMembersAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function setTaskAssigneesAction(
	taskId: string,
	projectId: string,
	userIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: "Unauthorized" };
		}

		await setTaskAssigneesInDB(taskId, projectId, userIds);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("setTaskAssigneesAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
