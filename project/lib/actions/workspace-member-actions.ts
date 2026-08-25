"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ProjectInviteEmail } from "@/app/(dashboard)/notifications/_components/email/project-invite-email";
import {
	PENDING_INVITE_MESSAGE,
	WORKSPACE_MEMBER_USER_FACING_ERRORS,
} from "@/lib/constants/action-errors";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	getWorkspaceDirectoryDAL,
	inviteToWorkspaceInDB,
	removeWorkspaceMembersDAL,
} from "@/lib/dal/workspace-members";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import { sendNotification } from "@/lib/email/send-notification";
import { toUserFacingError } from "@/lib/utils/action-error";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
	INVITE_RATE_LIMIT_MESSAGE,
	isWithinInviteRateLimit,
} from "@/lib/utils/invite-rate-limit";

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
	/**
	 * notice explanation - explains that a pending invite without an account
	 * is a success state with a notice, rather than an error to be raised.
	 */
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

		/**
		 * rate limit evaluation - validates invite rate limits prior to
		 * database writes to block unauthorized outbound emails.
		 */
		if (!(await isWithinInviteRateLimit(user.id))) {
			return { success: false, error: INVITE_RATE_LIMIT_MESSAGE };
		}

		const result = await inviteToWorkspaceInDB(email, workspaceId);

		revalidatePath("/team");

		if (result.outcome === "pending" || result.outcome === "invited") {
			/**
			 * default email opt-in - assumes consent to email for pending
			 * invites since unregistered users lack notification settings.
			 */
			let mayEmailInvitee = true;
			const invitedMemberId =
				result.outcome === "invited" ? result.invitedUserId : undefined;

			if (invitedMemberId) {
				/**
				 * dual notification dispatch - sends both an email and an
				 * in-app notification for directory invites, omitting projectId
				 * to correctly trigger workspace-level email preferences instead
				 * of project-level ones.
				 */
				const workspace = await resolveActiveWorkspaceDAL(workspaceId);
				const recorded = await recordActivity({
					workspaceId: workspace.id,
					actorId: user.id,
					actionType: "INVITE_SENT",
					details: `Invited ${email} to the directory`,
					notify: [
						{
							recipientId: invitedMemberId,
							message: "You have been invited to a people directory",
						},
					],
				});

				mayEmailInvitee = recorded.some(
					(entry) =>
						entry.recipientId === invitedMemberId && entry.shouldSendEmail,
				);
			}

			after(async () => {
				try {
					const activeWorkspace = await resolveActiveWorkspaceDAL(workspaceId);
					const invitedBy = user.firstName
						? `${user.firstName} ${user.lastName || ""}`.trim()
						: user.email;
					const inviteUrl = `${getAppBaseUrl()}/sign-up`;

					await sendNotification({
						to: email,
						subject: `You've been invited to ${activeWorkspace.name}`,
						shouldSend: mayEmailInvitee,
						template: ProjectInviteEmail({
							invitedBy,
							projectName: "the directory",
							workspaceName: activeWorkspace.name,
							inviteUrl,
						}),
					});
				} catch (error) {
					console.error("Failed to send workspace invite email:", error);
				}
			});
		}

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
 * remove workspace members action - removes members from the
 * workspace directory, accepting an array to unify single and bulk
 * removal operations.
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
