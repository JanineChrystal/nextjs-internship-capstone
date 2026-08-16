import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
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

/**
 * Everyone in the caller's workspace directory, with the projects they can
 * reach and the job roles they hold.
 *
 * Three grouped queries run in parallel and are merged in memory, rather than
 * one query per member. Project access is counted from BOTH routes - direct
 * ProjectMembers rows and Teams linked to projects - then de-duplicated,
 * because a user reachable by both must not be counted twice.
 */
export async function getWorkspaceDirectoryDAL(
	workspaceId?: string,
): Promise<WorkspaceMemberOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	try {
		const [memberRows, directRows, teamRows] = await Promise.all([
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
		]);

		// Sets rather than arrays so the two access routes de-duplicate for free.
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

		return memberRows.map((row) =>
			toWorkspaceMemberDTO(
				row.membership,
				row.user,
				Array.from(projectIdsByUser.get(row.user.id) ?? []),
				Array.from(jobRolesByUser.get(row.user.id) ?? []),
			),
		);
	} catch (error) {
		throw new Error("Failed to fetch workspace directory", { cause: error });
	}
}

/**
 * Removes people from the caller's workspace directory only.
 *
 * Deliberately does NOT cascade. A workspace here is a personal contact
 * directory, not a shared organisation, so removing someone must not revoke the
 * team and project memberships they hold - those may have been granted by other
 * people, and other users' directories are unaffected. The member simply stops
 * appearing in this directory and in this user's member pickers; re-inviting
 * them by email restores the row.
 *
 * Serves single and bulk removal through the same batched path.
 */
export async function removeWorkspaceMembersDAL(
	userIds: string[],
	workspaceId?: string,
): Promise<{ removedCount: number }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");
	if (userIds.length === 0) return { removedCount: 0 };

	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	// Only the workspace owner administers the directory - membership carries no
	// role column, so administration is intentionally binary.
	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can remove members");
	}

	// Removing the owner would leave the workspace unadministerable.
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
