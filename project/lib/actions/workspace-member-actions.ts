"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	getWorkspaceDirectoryDAL,
	removeWorkspaceMembersDAL,
} from "@/lib/dal/workspace-members";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";

// Messages raised deliberately by the DAL for the user to read; anything else
// is reported generically so database internals are never surfaced.
const USER_FACING_ERRORS = [
	"Workspace not found",
	"No active workspace found for user",
	"Only the workspace owner can remove members",
	"The workspace owner cannot be removed",
];

function toUserFacingError(error: unknown): string {
	return error instanceof Error && USER_FACING_ERRORS.includes(error.message)
		? error.message
		: "An unexpected error occurred";
}

export async function getWorkspaceDirectoryAction(
	workspaceId?: string,
): Promise<{
	success: boolean;
	data?: WorkspaceMemberOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const members = await getWorkspaceDirectoryDAL(workspaceId);
		return { success: true, data: members };
	} catch (error) {
		console.error("getWorkspaceDirectoryAction error:", error);
		return { success: false, error: toUserFacingError(error) };
	}
}

/**
 * Removes members from the caller's directory. Accepts an array so single and
 * bulk removal share one batched code path.
 */
export async function removeWorkspaceMembersAction(
	userIds: string[],
	workspaceId?: string,
): Promise<{ success: boolean; removedCount?: number; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Unauthorized" };

		if (userIds.length === 0) {
			return { success: false, error: "No members selected" };
		}

		const { removedCount } = await removeWorkspaceMembersDAL(
			userIds,
			workspaceId,
		);

		revalidatePath("/team");
		return { success: true, removedCount };
	} catch (error) {
		console.error("removeWorkspaceMembersAction error:", error);
		return { success: false, error: toUserFacingError(error) };
	}
}
