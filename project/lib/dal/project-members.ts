import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	createPendingInviteInDB,
	normalizeInviteEmail,
} from "@/lib/dal/pending-invites";
import { db } from "@/lib/db";
import {
	projectMembers,
	projects,
	projectTeams,
	teamMembers,
	teams,
	users,
} from "@/lib/db/schema";
import {
	type ProjectMemberDetailedOutputDTO,
	type ProjectMemberOutputDTO,
	toMemberName,
} from "@/lib/dtos/project-member-dto";
import type { InviteOutcome } from "@/lib/types/pending-invite";

/** project members access - defines who can reach a project and at what level, separated to maintain SRP. */

export async function inviteUserToProjectInDB(
	projectId: string,
	email: string,
	jobRole = "Contributor",
	accessLevel: "co-owner" | "member" | "guest" = "member",
): Promise<InviteOutcome> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const normalizedEmail = normalizeInviteEmail(email);

	try {
		const [existingProject] = await db
			.select()
			.from(projects)
			.where(eq(projects.id, projectId));

		if (!existingProject) throw new Error("Project not found");

		const [knownUser] = await db
			.select()
			.from(users)
			.where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));

		/** store pending invitation - saves invites for unregistered emails to be claimed via webhook upon signup. */
		if (!knownUser) {
			await createPendingInviteInDB({
				workspaceId: existingProject.workspaceId,
				projectId,
				email: normalizedEmail,
				invitedBy: user.id,
				position: jobRole,
				accessLevel,
			});

			/** log pending invite activity - records the invite action immediately, pending the INVITE_ACCEPTED completion event. */
			await recordActivity({
				workspaceId: existingProject.workspaceId,
				actorId: user.id,
				actionType: "INVITE_SENT",
				details: `Invited ${normalizedEmail} (no account yet)`,
				projectId,
			});

			return "pending";
		}

		/**
		 * invitations are offers, not grants.
		 *
		 * A registered person used to be written straight into ProjectMembers, so
		 * being invited and joining were the same event and there was nothing to
		 * accept or decline. They now get the same outstanding invitation an
		 * unregistered address gets - the only difference being that they have an
		 * account to see it in. The membership rows are written when they accept.
		 */
		await createPendingInviteInDB({
			workspaceId: existingProject.workspaceId,
			projectId,
			email: normalizedEmail,
			invitedBy: user.id,
			position: jobRole,
			accessLevel,
		});

		await recordActivity({
			workspaceId: existingProject.workspaceId,
			actorId: user.id,
			actionType: "INVITE_SENT",
			details: `Invited ${normalizedEmail}`,
			projectId,
			targetUserId: knownUser.id,
			notify: [
				{
					recipientId: knownUser.id,
					message: "You have been invited to a project",
				},
			],
		});

		return "invited";
	} catch (error) {
		if (error instanceof Error && error.message === "Project not found")
			throw error;
		throw new Error("Failed to invite user to project", { cause: error });
	}
}

export async function getProjectMembersDAL(
	projectId: string,
): Promise<ProjectMemberOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

		if (!project) return [];

		const [owner] = await db
			.select()
			.from(users)
			.where(eq(users.id, project.ownerId));

		const memberRows = await db
			.select({ user: users })
			.from(projectMembers)
			.innerJoin(users, eq(projectMembers.userId, users.id))
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					isNull(projectMembers.deletedAt),
				),
			);

		const teamMemberRows = await db
			.select({ user: users })
			.from(projectTeams)
			.innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
			.innerJoin(teams, eq(projectTeams.teamId, teams.id))
			.innerJoin(users, eq(teamMembers.userId, users.id))
			.where(
				and(eq(projectTeams.projectId, projectId), isNull(teams.deletedAt)),
			);

		const members: ProjectMemberOutputDTO[] = [];
		if (owner) {
			members.push({
				userId: owner.id,
				name: toMemberName(owner),
				email: owner.email,
				avatarUrl: owner.imageUrl ?? "",
			});
		}
		for (const { user: member } of memberRows) {
			if (members.some((m) => m.userId === member.id)) continue;
			members.push({
				userId: member.id,
				name: toMemberName(member),
				email: member.email,
				avatarUrl: member.imageUrl ?? "",
			});
		}
		for (const { user: member } of teamMemberRows) {
			if (members.some((m) => m.userId === member.id)) continue;
			members.push({
				userId: member.id,
				name: toMemberName(member),
				email: member.email,
				avatarUrl: member.imageUrl ?? "",
			});
		}

		return members;
	} catch (error) {
		throw new Error("Failed to fetch project members from database", {
			cause: error,
		});
	}
}

export async function getProjectMembersDetailedDAL(
	projectId: string,
): Promise<ProjectMemberDetailedOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

		if (!project) return [];

		const [owner] = await db
			.select()
			.from(users)
			.where(eq(users.id, project.ownerId));

		const memberRows = await db
			.select({ member: projectMembers, user: users })
			.from(projectMembers)
			.innerJoin(users, eq(projectMembers.userId, users.id))
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					isNull(projectMembers.deletedAt),
				),
			);

		const members: ProjectMemberDetailedOutputDTO[] = [];
		if (owner) {
			members.push({
				userId: owner.id,
				name: toMemberName(owner),
				email: owner.email,
				avatarUrl: owner.imageUrl ?? "",
				jobRole: "Project Owner",
				roleAccess: "owner",
				status: "joined",
				joinedAt: project.createdAt.toISOString(),
			});
		}
		for (const row of memberRows) {
			if (members.some((m) => m.userId === row.user.id)) continue;
			members.push({
				userId: row.user.id,
				name: toMemberName(row.user),
				email: row.user.email,
				avatarUrl: row.user.imageUrl ?? "",
				jobRole: row.member.position,
				roleAccess: row.member.accessLevel,
				status: "joined",
				joinedAt: row.member.createdAt.toISOString(),
			});
		}

		return members;
	} catch (error) {
		throw new Error("Failed to fetch project members from database", {
			cause: error,
		});
	}
}

export async function updateMemberRoleInDB(
	projectId: string,
	userId: string,
	accessLevel: "co-owner" | "member" | "guest",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ accessLevel, updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to update member role", { cause: error });
	}
}

export async function updateMemberJobRoleInDB(
	projectId: string,
	userId: string,
	jobRole: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ position: jobRole, updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to update member job role", { cause: error });
	}
}

export async function removeMemberFromProjectDAL(
	projectId: string,
	userId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to remove member from project", { cause: error });
	}
}

export async function assignTeamToProjectInDB(
	projectId: string,
	teamId: string,
	accessLevel: "owner" | "co-owner" | "member" | "guest" = "member",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.insert(projectTeams)
			.values({
				projectId,
				teamId,
				accessLevel,
			})
			.onConflictDoNothing();
	} catch (error) {
		throw new Error("Failed to assign team to project", { cause: error });
	}
}
