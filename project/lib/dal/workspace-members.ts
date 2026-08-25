import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	createPendingInviteInDB,
	normalizeInviteEmail,
} from "@/lib/dal/pending-invites";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import {
	activityLogs,
	projectMembers,
	projects,
	projectTeams,
	teamMembers,
	teams,
	users,
	workspaceMembers,
} from "@/lib/db/schema";
import {
	toWorkspaceMemberDTO,
	type WorkspaceMemberOutputDTO,
} from "@/lib/dtos/workspace-member-dto";
import type { InviteOutcome } from "@/lib/types/pending-invite";

/**
 * get workspace directory - efficiently retrieves all directory members
 * alongside their project access and roles by executing three parallel
 * grouped queries and merging the results in-memory.
 */
export async function getWorkspaceDirectoryDAL(
	workspaceId?: string,
): Promise<WorkspaceMemberOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	try {
		const [memberRows, directRows, teamRows, ownedRows] = await Promise.all([
			db
				.select({ membership: workspaceMembers, user: users })
				.from(workspaceMembers)
				.innerJoin(users, eq(workspaceMembers.userId, users.id))
				.where(
					and(
						eq(workspaceMembers.workspaceId, workspace.id),
						isNull(workspaceMembers.deletedAt),
						isNull(users.deletedAt),
					),
				),

			db
				.select({
					userId: projectMembers.userId,
					projectId: projectMembers.projectId,
					position: projectMembers.position,
				})
				.from(projectMembers)
				.innerJoin(projects, eq(projectMembers.projectId, projects.id))
				.where(
					and(
						eq(projects.workspaceId, workspace.id),
						isNull(projectMembers.deletedAt),
						isNull(projects.deletedAt),
					),
				),

			db
				.select({
					userId: teamMembers.userId,
					projectId: projectTeams.projectId,
				})
				.from(teamMembers)
				.innerJoin(teams, eq(teamMembers.teamId, teams.id))
				.innerJoin(projectTeams, eq(teamMembers.teamId, projectTeams.teamId))
				.innerJoin(projects, eq(projectTeams.projectId, projects.id))
				.where(
					and(
						eq(projects.workspaceId, workspace.id),
						isNull(teams.deletedAt),
						isNull(projects.deletedAt),
					),
				),

			/** include owned projects - counts project ownership as an access route to prevent owners from appearing with zero projects. */
			db
				.select({
					userId: projects.ownerId,
					projectId: projects.id,
				})
				.from(projects)
				.where(
					and(
						eq(projects.workspaceId, workspace.id),
						isNull(projects.deletedAt),
					),
				),
		]);

		/** deduplicate projects - uses Sets to automatically merge and deduplicate access routes. */
		const projectIdsByUser = new Map<string, Set<string>>();
		const jobRolesByUser = new Map<string, Set<string>>();

		const addProject = (userId: string, projectId: string) => {
			const existing = projectIdsByUser.get(userId) ?? new Set<string>();
			existing.add(projectId);
			projectIdsByUser.set(userId, existing);
		};

		for (const row of directRows) {
			addProject(row.userId, row.projectId);
			if (row.position) {
				const roles = jobRolesByUser.get(row.userId) ?? new Set<string>();
				roles.add(row.position);
				jobRolesByUser.set(row.userId, roles);
			}
		}

		for (const row of teamRows) {
			addProject(row.userId, row.projectId);
		}

		for (const row of ownedRows) {
			addProject(row.userId, row.projectId);
		}

		return (
			memberRows
				/** exclude self - filters out the caller's own row since the directory is meant for collaborators. */
				.filter((row) => row.user.id !== user.id)
				.map((row) =>
					toWorkspaceMemberDTO(
						row.membership,
						row.user,
						Array.from(projectIdsByUser.get(row.user.id) ?? []),
						Array.from(jobRolesByUser.get(row.user.id) ?? []),
					),
				)
		);
	} catch (error) {
		throw new Error("Failed to fetch workspace directory", { cause: error });
	}
}

/**
 * invite to workspace - adds an email to the caller's directory without
 * granting project access. Unregistered emails are safely recorded as pending
 * invites to be claimed upon signup.
 */
export async function inviteToWorkspaceInDB(
	email: string,
	workspaceId?: string,
): Promise<{
	outcome: InviteOutcome;
	member?: WorkspaceMemberOutputDTO;
	invitedUserId?: string;
}> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can invite members");
	}

	const normalizedEmail = normalizeInviteEmail(email);

	try {
		const [targetUser] = await db
			.select()
			.from(users)
			.where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));

		/**
		 * store pending invite - records invitations for unregistered users
		 * so directory membership is automatically granted upon signup.
		 */
		if (!targetUser) {
			await createPendingInviteInDB({
				workspaceId: workspace.id,
				projectId: null,
				email: normalizedEmail,
				invitedBy: user.id,
			});
			return { outcome: "pending" };
		}

		if (targetUser.id === user.id) {
			throw new Error("You are already a member of this workspace");
		}

		/**
		 * offered, not granted - a registered person now receives the same
		 * outstanding invitation an unregistered address does, and the mutual
		 * directory link is written when they accept. Linking here instead made
		 * the invitee a directory member the moment someone typed their address,
		 * with nothing to accept and no way to decline.
		 */
		await createPendingInviteInDB({
			workspaceId: workspace.id,
			projectId: null,
			email: normalizedEmail,
			invitedBy: user.id,
		});

		/** invitee id returned - they are not a member yet, so there is no member DTO, but the caller still needs someone to notify. */
		return { outcome: "invited", invitedUserId: targetUser.id };
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "You are already a member of this workspace"
		) {
			throw error;
		}
		throw new Error("Failed to invite member to workspace", { cause: error });
	}
}

/**
 * remove workspace members - removes users from the caller's directory
 * without cascading to projects or teams, functioning as a personal contact
 * list removal rather than an organizational revocation.
 */
export async function removeWorkspaceMembersDAL(
	userIds: string[],
	workspaceId?: string,
): Promise<{ removedCount: number }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");
	if (userIds.length === 0) return { removedCount: 0 };

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	/** verify workspace ownership - ensures only the owner can administer the directory, as membership lacks granular roles. */
	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can remove members");
	}

	/** protect owner - prevents removal of the workspace owner to ensure the workspace remains administrable. */
	if (userIds.includes(workspace.ownerId)) {
		throw new Error("The workspace owner cannot be removed");
	}

	try {
		return await db.transaction(async (tx) => {
			const removed = await tx
				.update(workspaceMembers)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(
					and(
						eq(workspaceMembers.workspaceId, workspace.id),
						inArray(workspaceMembers.userId, userIds),
						isNull(workspaceMembers.deletedAt),
					),
				)
				.returning({ userId: workspaceMembers.userId });

			if (removed.length > 0) {
				await tx.insert(activityLogs).values(
					removed.map((row) => ({
						workspaceId: workspace.id,
						actorId: user.id,
						targetUserId: row.userId,
						actionType: "WORKSPACE_MEMBER_REMOVED" as const,
						details: "Removed from workspace directory",
					})),
				);
			}

			return { removedCount: removed.length };
		});
	} catch (error) {
		throw new Error("Failed to remove workspace members", { cause: error });
	}
}
