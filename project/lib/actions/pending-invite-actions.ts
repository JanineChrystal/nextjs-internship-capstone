"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	getIncomingInvitesDAL,
	getProjectPendingInvitesDAL,
	getWorkspacePendingInvitesDAL,
	respondToPendingInviteDAL,
	revokePendingInviteDAL,
} from "@/lib/dal/pending-invites";
import type { PendingInviteOutputDTO } from "@/lib/dtos/pending-invite-dto";

export async function getProjectPendingInvitesAction(
	projectId: string,
): Promise<{
	success: boolean;
	data?: PendingInviteOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const invites = await getProjectPendingInvitesDAL(projectId);
		return { success: true, data: invites };
	} catch (error) {
		console.error("getProjectPendingInvitesAction error:", error);
		return { success: false, error: "Failed to load pending invites" };
	}
}

export async function getWorkspacePendingInvitesAction(
	workspaceId?: string,
): Promise<{
	success: boolean;
	data?: PendingInviteOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const invites = await getWorkspacePendingInvitesDAL(workspaceId);
		return { success: true, data: invites };
	} catch (error) {
		console.error("getWorkspacePendingInvitesAction error:", error);
		return { success: false, error: "Failed to load pending invites" };
	}
}

export async function getIncomingInvitesAction(): Promise<{
	success: boolean;
	data?: PendingInviteOutputDTO[];
	error?: string;
}> {
	try {
		return { success: true, data: await getIncomingInvitesDAL() };
	} catch (error) {
		console.error("getIncomingInvitesAction error:", error);
		return { success: false, error: "Could not load your invitations" };
	}
}

/**
 * respond to invite - the invitee's accept or reject. Authorisation lives in the
 * DAL and is by email match, so no permission check belongs here.
 */
export async function respondToPendingInviteAction(
	inviteId: string,
	response: "accept" | "reject",
): Promise<{ success: boolean; error?: string }> {
	try {
		const { projectId } = await respondToPendingInviteDAL(inviteId, response);

		revalidatePath("/team");
		revalidatePath("/projects");
		if (projectId) revalidatePath(`/projects/${projectId}`);

		return { success: true };
	} catch (error) {
		console.error("respondToPendingInviteAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error && error.message === "Invite not found"
					? "That invitation is no longer available"
					: "An unexpected error occurred",
		};
	}
}

export async function revokePendingInviteAction(
	inviteId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await revokePendingInviteDAL(inviteId);

		revalidatePath("/team");
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return {
				success: false,
				error: "You do not have permission to revoke this invite",
			};
		}
		console.error("revokePendingInviteAction error:", error);
		return { success: false, error: "Failed to revoke invite" };
	}
}
