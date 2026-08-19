"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { projects, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "@/lib/email/send-notification";
import { ProjectInviteEmail } from "@/app/(dashboard)/notifications/_components/email/project-invite-email";
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
		let invitedUserId: string | null = null;
		
		if (actor && outcome === "invited") {
			invitedUserId = await findUserIdByEmailDAL(email);
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
		if (outcome === "pending" || outcome === "invited") {
			after(async () => {
				try {
					if (!actor) return;
					const [project] = await db
						.select({ 
							projectName: projects.name, 
							workspaceName: workspaces.name 
						})
						.from(projects)
						.innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
						.where(eq(projects.id, projectId));
						
					if (!project) return;
					
					const invitedBy = actor.firstName 
						? `${actor.firstName} ${actor.lastName || ""}`.trim() 
						: actor.email;
						
					const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-up`;
					
					// We don't have the user ID for a pending invite, so we cannot check their DB preferences.
					// We'll pass a dummy userId for now or skip checking for pending invites if we adjust sendNotification.
					// Actually, getNotificationSettings expects a real user ID. 
					// For invites to non-users, they definitely want the email. We can bypass preference check or pass a flag.
					// Let's modify sendNotification to skip preference check if userId is empty.
					await sendNotification({
						userId: outcome === "invited" && invitedUserId ? invitedUserId : "pending-user", 
						to: email,
						subject: `You've been invited to ${project.projectName}`,
						type: "emailProjectInvites",
						template: ProjectInviteEmail({
							invitedBy,
							projectName: project.projectName,
							workspaceName: project.workspaceName,
							inviteUrl,
						})
					});
				} catch (error) {
					console.error("Failed to send invite email:", error);
				}
			});
		}

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
