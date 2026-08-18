"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import {
	assignTeamToProjectInDB,
	getProjectMembersDetailedDAL,
	inviteUserToProjectInDB,
	removeMemberFromProjectDAL,
	updateMemberJobRoleInDB,
	updateMemberRoleInDB,
} from "@/lib/dal/project-members";
import { findUserIdByEmailDAL } from "@/lib/dal/users";
import type { ProjectMemberDetailedOutputDTO } from "@/lib/dtos/project-member-dto";

/**
 * Server actions for project membership, mirroring the lib/dal/project-members
 * split one layer up.
 *
 * Keeping the action and DAL boundaries identical is the point: when the two
 * layers are carved differently, tracing a feature means jumping between files
 * that only half overlap.
 */

export async function inviteUserToProjectAction(
	projectId: string,
	email: string,
	jobRole?: string,
	accessLevel?: "co-owner" | "member" | "guest",
): Promise<{ success: boolean; notice?: string; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const outcome = await inviteUserToProjectInDB(
			projectId,
			email,
			jobRole,
			accessLevel,
		);

		// A real membership row only exists for the "invited" outcome; a pending
		// invite has no Users row yet, so there is nobody to notify. That case is
		// covered by INVITE_ACCEPTED when they eventually sign up.
		const actor = await getCurrentUser();
		if (actor && outcome === "invited") {
			const invitedUserId = await findUserIdByEmailDAL(email);
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: actor.id,
				actionType: "PROJECT_MEMBER_ADDED",
				details: `Added ${email} to the project`,
				projectId,
				targetUserId: invitedUserId,
				notify: invitedUserId
					? [
							{
								recipientId: invitedUserId,
								message: "You were added to a project",
							},
						]
					: [],
			});
		}

		revalidatePath(`/projects/${projectId}`);

		// An address with no account is no longer a failure: the invitation is
		// stored and claimed on signup, so the caller is told what happened rather
		// than shown an error.
		if (outcome === "pending") {
			return {
				success: true,
				notice: `${email} has not signed up yet. The invite is saved and will apply when they do.`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("inviteUserToProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function getProjectMembersDetailedAction(
	projectId: string,
): Promise<{
	success: boolean;
	data?: ProjectMemberDetailedOutputDTO[];
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

		const members = await getProjectMembersDetailedDAL(projectId);
		return { success: true, data: members };
	} catch (error) {
		console.error("getProjectMembersDetailedAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateMemberRoleAction(
	projectId: string,
	userId: string,
	accessLevel: "co-owner" | "member" | "guest",
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await updateMemberRoleInDB(projectId, userId, accessLevel);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("updateMemberRoleAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateMemberJobRoleAction(
	projectId: string,
	userId: string,
	jobRole: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await updateMemberJobRoleInDB(projectId, userId, jobRole);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("updateMemberJobRoleAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function removeMemberAction(
	projectId: string,
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await removeMemberFromProjectDAL(projectId, userId);

		// Logged for the project history, but the removed member is not notified:
		// they lose access to the project immediately, which is feedback enough.
		const actor = await getCurrentUser();
		if (actor) {
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: actor.id,
				actionType: "PROJECT_MEMBER_REMOVED",
				details: "Removed a member from the project",
				projectId,
				targetUserId: userId,
			});
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("removeMemberAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function assignTeamToProjectAction(
	projectId: string,
	teamId: string,
	accessLevel: "owner" | "co-owner" | "member" | "guest" = "member",
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_project",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await assignTeamToProjectInDB(projectId, teamId, accessLevel);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("assignTeamToProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
