"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import { getProjectMembersDAL } from "@/lib/dal/project-members";
import { setTaskAssigneesInDB } from "@/lib/dal/task-assignees";
import type { ProjectMemberOutputDTO } from "@/lib/dtos/project-member-dto";

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
			return { success: false, error: await getSessionFailureReason() };
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
			return { success: false, error: await getSessionFailureReason() };
		}

		const { addedUserIds } = await setTaskAssigneesInDB(
			taskId,
			projectId,
			userIds,
		);

		/**
		 * isolated assignee notification - sends assignment notifications
		 * only to newly added members to prevent spamming existing
		 * assignees during other edits.
		 */
		const user = await getCurrentUser();
		if (user && addedUserIds.length > 0) {
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "TASK_ASSIGNED",
				details: `Assigned ${addedUserIds.length} member(s) to this task`,
				projectId,
				taskId,
				notify: addedUserIds.map((recipientId) => ({
					recipientId,
					message: "You were assigned to a task",
				})),
			});
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("setTaskAssigneesAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
