import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import {
	projectMembers,
	projects,
	teamMembers,
	teams,
	users,
} from "@/lib/db/schema";
import {
	type GroupMemberDTO,
	type GroupOutputDTO,
	toGroupDTO,
	toGroupMemberDTO,
} from "@/lib/dtos/group-dto";

/**
 * Groups are saved lists of collaborators, stored in the existing Teams tables.
 *
 * They are deliberately a *template*, not a live link: applying a group copies
 * its people into a project as ordinary ProjectMembers rows, and nothing about
 * the group is consulted afterwards. Editing or deleting a group therefore never
 * changes who can reach a project that was created from it.
 *
 * The alternative - resolving access through the group at request time, via
 * ProjectTeams - is already supported by getEffectiveProjectRoleDAL, so this can
 * become a live link later without reworking access resolution. The snapshot
 * model was chosen because "a saved list of people you can add in one click" is
 * a single sentence to explain, whereas live links make one edit silently change
 * access across every linked project.
 */

async function requireGroupManager(projectId: string): Promise<void> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (role !== "owner" && role !== "co-owner") {
		throw new Error("Unauthorized");
	}
}

/**
 * Every group in the caller's workspace, with how many people each holds.
 *
 * One grouped count query rather than a lookup per group, so the cost does not
 * grow with the number of groups.
 */
export async function getWorkspaceGroupsDAL(): Promise<GroupOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	const rows = await db
		.select({
			team: teams,
			memberCount: sql<number>`count(${teamMembers.userId})`,
		})
		.from(teams)
		.leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
		.where(and(eq(teams.workspaceId, workspace.id), isNull(teams.deletedAt)))
		.groupBy(teams.id);

	return rows.map((row) => toGroupDTO(row.team, Number(row.memberCount)));
}

export async function getGroupMembersDAL(
	groupId: string,
): Promise<GroupMemberDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	// Confirms the group belongs to the caller's workspace before returning any
	// of its people.
	const [group] = await db
		.select({ id: teams.id })
		.from(teams)
		.where(
			and(
				eq(teams.id, groupId),
				eq(teams.workspaceId, workspace.id),
				isNull(teams.deletedAt),
			),
		);

	if (!group) throw new Error("Group not found");

	const rows = await db
		.select({ user: users })
		.from(teamMembers)
		.innerJoin(users, eq(teamMembers.userId, users.id))
		.where(and(eq(teamMembers.teamId, groupId), isNull(users.deletedAt)));

	return rows.map((row) => toGroupMemberDTO(row.user));
}

/**
 * Captures a project's current members as a reusable group.
 *
 * The project owner is included alongside the ProjectMembers rows, because
 * owning a project produces no membership row and leaving them out would make
 * the saved group quietly incomplete.
 */
export async function saveProjectMembersAsGroupDAL(
	projectId: string,
	name: string,
	description?: string,
): Promise<GroupOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	await requireGroupManager(projectId);

	const [project] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

	if (!project) throw new Error("Project not found");

	const memberRows = await db
		.select({ userId: projectMembers.userId })
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				isNull(projectMembers.deletedAt),
			),
		);

	const userIds = Array.from(
		new Set([project.ownerId, ...memberRows.map((row) => row.userId)]),
	);

	try {
		return await db.transaction(async (tx) => {
			const [newGroup] = await tx
				.insert(teams)
				.values({
					workspaceId: project.workspaceId,
					name: name.trim(),
					description: description?.trim() || null,
				})
				.returning();

			if (userIds.length > 0) {
				await tx
					.insert(teamMembers)
					.values(userIds.map((userId) => ({ teamId: newGroup.id, userId })))
					.onConflictDoNothing();
			}

			return toGroupDTO(newGroup, userIds.length);
		});
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("Teams_workspaceId_name_live_unique")
		) {
			throw new Error("A group with that name already exists");
		}
		throw new Error("Failed to save group", { cause: error });
	}
}

/**
 * Copies a group's people into a project.
 *
 * Existing members keep the position and access level they already hold: the
 * conflict path only clears deletedAt. Applying a group must never demote
 * someone who was already there, and it is a one-time copy, so no link back to
 * the group is recorded.
 */
export async function applyGroupToProjectDAL(
	projectId: string,
	groupId: string,
	accessLevel: "co-owner" | "member" | "guest" = "member",
): Promise<{ addedCount: number }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	await requireGroupManager(projectId);

	const workspace = await resolveActiveWorkspaceDAL();

	const [group] = await db
		.select({ id: teams.id })
		.from(teams)
		.where(
			and(
				eq(teams.id, groupId),
				eq(teams.workspaceId, workspace.id),
				isNull(teams.deletedAt),
			),
		);

	if (!group) throw new Error("Group not found");

	const [project] = await db
		.select({ ownerId: projects.ownerId })
		.from(projects)
		.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

	if (!project) throw new Error("Project not found");

	const memberRows = await db
		.select({ userId: teamMembers.userId })
		.from(teamMembers)
		.where(eq(teamMembers.teamId, groupId));

	// The owner already has full access through ownership; inserting a
	// ProjectMembers row for them would show a duplicate in the member list.
	const userIds = memberRows
		.map((row) => row.userId)
		.filter((id) => id !== project.ownerId);

	if (userIds.length === 0) return { addedCount: 0 };

	await db
		.insert(projectMembers)
		.values(
			userIds.map((userId) => ({
				projectId,
				userId,
				position: "Contributor",
				accessLevel,
			})),
		)
		.onConflictDoUpdate({
			target: [projectMembers.projectId, projectMembers.userId],
			set: { deletedAt: null, updatedAt: new Date() },
		});

	return { addedCount: userIds.length };
}

/**
 * Replaces a group's roster. Managed from project settings, which is the only
 * place groups are surfaced.
 */
export async function setGroupMembersDAL(
	groupId: string,
	userIds: string[],
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can edit groups");
	}

	const [group] = await db
		.select({ id: teams.id })
		.from(teams)
		.where(
			and(
				eq(teams.id, groupId),
				eq(teams.workspaceId, workspace.id),
				isNull(teams.deletedAt),
			),
		);

	if (!group) throw new Error("Group not found");

	await db.transaction(async (tx) => {
		// TeamMembers is hard-deleted, so replacing the roster is a delete and
		// re-insert rather than a soft-delete sweep.
		await tx.delete(teamMembers).where(eq(teamMembers.teamId, groupId));

		if (userIds.length > 0) {
			await tx
				.insert(teamMembers)
				.values(userIds.map((userId) => ({ teamId: groupId, userId })))
				.onConflictDoNothing();
		}
	});
}

export async function deleteGroupDAL(groupId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can delete groups");
	}

	// Soft delete, which also frees the name for reuse thanks to the partial
	// unique index on live rows only. Projects created from this group are
	// untouched - that is the point of the snapshot model.
	await db
		.update(teams)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(teams.id, groupId),
				eq(teams.workspaceId, workspace.id),
				isNull(teams.deletedAt),
			),
		);
}

/**
 * Candidates for a group's roster: everyone already reachable in the workspace
 * directory. Used by the member picker in project settings.
 */
export async function getGroupCandidatesDAL(
	userIds: string[],
): Promise<GroupMemberDTO[]> {
	if (userIds.length === 0) return [];

	const rows = await db
		.select()
		.from(users)
		.where(and(inArray(users.id, userIds), isNull(users.deletedAt)));

	return rows.map(toGroupMemberDTO);
}
