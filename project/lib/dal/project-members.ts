import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	createPendingInviteInDB,
	normalizeInviteEmail,
} from "@/lib/dal/pending-invites";
import { linkWorkspaceDirectoriesInDB } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { projectMembers, projects, projectTeams, users } from "@/lib/db/schema";
import {
	type ProjectMemberDetailedOutputDTO,
	type ProjectMemberOutputDTO,
	toMemberName,
} from "@/lib/dtos/project-member-dto";
import type { InviteOutcome } from "@/lib/types/pending-invite";

/**
 * Who can reach a project and at what level.
 *
 * Split out of projects.ts, which had grown past 700 lines doing two unrelated
 * jobs. Project CRUD and membership rules change for different reasons and on
 * different schedules - the access model has been revised repeatedly while
 * createProjectInDB has barely moved - which is the Single Responsibility
 * Principle's actual test: one reason to change, not one topic.
 */

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

		// Nobody by that address yet. Store the invitation instead of refusing it;
		// the Clerk webhook converts it into real membership on signup.
		if (!knownUser) {
			await createPendingInviteInDB({
				workspaceId: existingProject.workspaceId,
				projectId,
				email: normalizedEmail,
				invitedBy: user.id,
				position: jobRole,
				accessLevel,
			});
			return "pending";
		}

		await db.transaction(async (tx) => {
			const targetUser = knownUser;
			const project = existingProject;

			// Fills both contact directories, not just the inviter's: the invitee
			// joins the project workspace's directory, and the inviter joins the
			// invitee's own. Sharing a project is a two-way working relationship, so
			// each side should be able to find the other on their team page.
			await linkWorkspaceDirectoriesInDB(tx, {
				inviterId: user.id,
				inviteeId: targetUser.id,
				inviterWorkspaceId: project.workspaceId,
			});

			await tx
				.insert(projectMembers)
				.values({
					projectId: projectId,
					userId: targetUser.id,
					position: jobRole,
					accessLevel,
				})
				.onConflictDoUpdate({
					target: [projectMembers.projectId, projectMembers.userId],
					set: { deletedAt: null, position: jobRole, accessLevel },
				});
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
