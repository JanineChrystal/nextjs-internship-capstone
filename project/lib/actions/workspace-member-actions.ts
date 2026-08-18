"use server";

import { revalidatePath } from "next/cache";
import {
	PENDING_INVITE_MESSAGE,
	WORKSPACE_MEMBER_USER_FACING_ERRORS,
} from "@/lib/constants/action-errors";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	getWorkspaceDirectoryDAL,
	inviteToWorkspaceInDB,
	removeWorkspaceMembersDAL,
} from "@/lib/dal/workspace-members";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import { toUserFacingError } from "@/lib/utils/action-error";

export async function getWorkspaceDirectoryAction(
	workspaceId?: string,
): Promise<{
	success: boolean;
	data?: WorkspaceMemberOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const members = await getWorkspaceDirectoryDAL(workspaceId);
		return { success: true, data: members };
	} catch (error) {
		console.error("getWorkspaceDirectoryAction error:", error);
		return {
			success: false,
			error: toUserFacingError(error, WORKSPACE_MEMBER_USER_FACING_ERRORS),
		};
	}
}

export async function inviteToWorkspaceAction(
	email: string,
	workspaceId?: string,
): Promise<{
	success: boolean;
	data?: WorkspaceMemberOutputDTO;
	// Set when the address had no account and the invitation was stored instead.
	// A success, not a failure - the caller reports it rather than raising it.
	notice?: string;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		if (!email.trim()) {
			return { success: false, error: "Email is required" };
		}

		const result = await inviteToWorkspaceInDB(email, workspaceId);

		revalidatePath("/team");

		if (result.outcome === "pending") {
			return { success: true, notice: PENDING_INVITE_MESSAGE };
		}

		return { success: true, data: result.member };
	} catch (error) {
		console.error("inviteToWorkspaceAction error:", error);
		return {
			success: false,
			error: toUserFacingError(error, WORKSPACE_MEMBER_USER_FACING_ERRORS),
		};
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
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

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
		return {
			success: false,
			error: toUserFacingError(error, WORKSPACE_MEMBER_USER_FACING_ERRORS),
		};
	}
}
