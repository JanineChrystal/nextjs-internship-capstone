"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
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
import { db } from "@/lib/db";
import { projects, workspaces } from "@/lib/db/schema";
import type { ProjectMemberDetailedOutputDTO } from "@/lib/dtos/project-member-dto";
import { sendNotification } from "@/lib/email/send-notification";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
	INVITE_RATE_LIMIT_MESSAGE,
	isWithinInviteRateLimit,
} from "@/lib/utils/invite-rate-limit";

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

		// Checked before the write, not after: the point is to stop the outbound
		// email, and by the time the membership row exists the invitation has
		// effectively happened.
		const limitActor = await getCurrentUser();
		if (limitActor && !(await isWithinInviteRateLimit(limitActor.id))) {
			return { success: false, error: INVITE_RATE_LIMIT_MESSAGE };
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
		// Nobody to consult for a pending invite: there is no settings row, and
		// someone has not had the chance to opt out of the message telling them
		// they were invited.
		let mayEmailInvitee = true;

		if (actor && outcome === "invited") {
			invitedUserId = await findUserIdByEmailDAL(email);
			const recorded = await recordActivity({
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

			if (invitedUserId) {
				mayEmailInvitee = recorded.some(
					(entry) =>
						entry.recipientId === invitedUserId && entry.shouldSendEmail,
				);
			}
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
							workspaceName: workspaces.name,
						})
						.from(projects)
						.innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
						.where(eq(projects.id, projectId));

					if (!project) return;

					const invitedBy = actor.firstName
						? `${actor.firstName} ${actor.lastName || ""}`.trim()
						: actor.email;

					const inviteUrl = `${getAppBaseUrl()}/sign-up`;

					await sendNotification({
						to: email,
						subject: `You've been invited to ${project.projectName}`,
						shouldSend: mayEmailInvitee,
						template: ProjectInviteEmail({
							invitedBy,
							projectName: project.projectName,
							workspaceName: project.workspaceName,
							inviteUrl,
						}),
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
