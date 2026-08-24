import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { DUPLICATE_GROUP_ROSTER_ERROR } from "@/lib/constants/action-errors";
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
 * groups template model - defines groups as static templates utilizing
 * the Teams schema, copying members directly into projects on application
 * to avoid unexpected, cascading access changes.
 */

async function requireGroupManager(projectId: string): Promise<void> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (role !== "owner" && role !== "co-owner") {
		throw new Error("Unauthorized");
	}
}

/**
 * get workspace groups - retrieves all groups in the active workspace
 * with a single grouped count query to keep performance decoupled from
 * the number of groups.
 */
export async function getWorkspaceGroupsDAL(): Promise<GroupOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	const rows = await db
		.select({
			team: teams,
			memberCount: sql<number>`count(${teamMembers.userId})`,
			/** aggregated roster - collected in the same grouped query rather than a second round trip per group, so the cost stays independent of how many groups exist. */
			memberIds: sql<
				string[]
			>`coalesce(array_remove(array_agg(${teamMembers.userId}), null), '{}')`,
		})
		.from(teams)
		.leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
		.where(and(eq(teams.workspaceId, workspace.id), isNull(teams.deletedAt)))
		.groupBy(teams.id);

	return rows.map((row) =>
		toGroupDTO(row.team, Number(row.memberCount), row.memberIds ?? []),
	);
}

/** same roster - set comparison, so member order and duplicates never decide the answer. */
function isSameRoster(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const left = new Set(a);
	return b.every((id) => left.has(id));
}

export async function getGroupMembersDAL(
	groupId: string,
): Promise<GroupMemberDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	/** verify workspace ownership - ensures the requested group belongs to the active workspace before leaking member data. */
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
 * save project members as group - snapshots a project's current member
 * list into a reusable group template, explicitly injecting the project
 * owner to ensure a complete roster.
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

	/**
	 * duplicate roster guard - a group is a saved list of people, so a second
	 * group holding exactly the same people is not a new template, only a second
	 * name for one that exists. Blocking it here rather than in the form means it
	 * holds however the save is triggered.
	 */
	const existing = await getWorkspaceGroupsDAL();
	const duplicate = existing.some((group) =>
		isSameRoster(group.memberIds, userIds),
	);
	if (duplicate) {
		/** fixed wording - the action only forwards messages on an exact-match allow-list, so interpolating the group's name here would collapse the whole thing to "An unexpected error occurred". */
		throw new Error(DUPLICATE_GROUP_ROSTER_ERROR);
	}

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
 * apply group to project - copies group members into a project,
 * resolving conflicts harmlessly to preserve existing positions and
 * access levels without establishing a live link back to the group.
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

	/** omit duplicate owner - filters out the project owner from insertion to prevent duplicate listing in the members UI. */
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
 * set group members - completely replaces a group's roster, executed via
 * the project settings surface.
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
		/** hard delete swap - implements roster replacement via a delete-and-insert transaction since TeamMembers uses hard deletion. */
		await tx.delete(teamMembers).where(eq(teamMembers.teamId, groupId));

		if (userIds.length > 0) {
			await tx
				.insert(teamMembers)
				.values(userIds.map((userId) => ({ teamId: groupId, userId })))
				.onConflictDoNothing();
		}
	});
}

/**
 * sync group to project members - replaces a group's roster with the project's
 * current members. This is the counterpart to the duplicate guard: once a set of
 * people is saved, the way to record that the project's membership has moved on
 * is to update that group, not to save a near-identical second one.
 */
export async function syncGroupToProjectMembersDAL(
	groupId: string,
	projectId: string,
): Promise<{ memberCount: number }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	await requireGroupManager(projectId);

	const [project] = await db
		.select({ ownerId: projects.ownerId })
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

	/** owner included - matches saveProjectMembersAsGroupDAL, so a group saved and then synced holds the same people rather than quietly losing the owner. */
	const userIds = Array.from(
		new Set([project.ownerId, ...memberRows.map((row) => row.userId)]),
	);

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

	/**
	 * gated like save, not like setGroupMembers - the latter is workspace-owner
	 * only, but this path is the alternative offered when a co-owner is refused a
	 * duplicate group. Holding it to a stricter rule than the save it replaces
	 * would leave that co-owner with no way forward at all.
	 */
	await db.transaction(async (tx) => {
		await tx.delete(teamMembers).where(eq(teamMembers.teamId, groupId));

		if (userIds.length > 0) {
			await tx
				.insert(teamMembers)
				.values(userIds.map((userId) => ({ teamId: groupId, userId })))
				.onConflictDoNothing();
		}
	});

	return { memberCount: userIds.length };
}

export async function deleteGroupDAL(groupId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const workspace = await resolveActiveWorkspaceDAL();

	if (workspace.ownerId !== user.id) {
		throw new Error("Only the workspace owner can delete groups");
	}

	/**
	 * soft delete group - soft deletes the group to free its name for reuse,
	 * intentionally leaving previously created projects unaffected per the
	 * snapshot model.
	 */
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
 * get group candidates - retrieves all reachable users from the workspace
 * directory to populate the member picker in project settings.
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
