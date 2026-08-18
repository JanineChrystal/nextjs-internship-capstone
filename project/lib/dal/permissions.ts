import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { cache } from "react";
import { hasPermission, resolveEffectiveRole } from "@/lib/config/permissions";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import {
	projectMembers,
	projects,
	projectTeams,
	teamMembers,
	teams,
	workspaceMembers,
	workspaces,
} from "@/lib/db/schema";
import type { Permission, RoleAccess } from "@/lib/types/member";

/**
 * Resolves the single role that governs a user's access to a project.
 *
 * Access can arrive by three independent routes, and a user may hold several at
 * once, so all three are gathered in ONE round trip and collapsed to the
 * highest-ranked role:
 *
 *   1. Project owner
 *   2. A direct ProjectMembers row
 *   3. Membership of a Team that has been linked to the project
 *
 * Route 3 was previously ignored entirely, which meant anyone whose access came
 * through a team failed every permission check.
 *
 * Returns null when the user has no access at all, or the project does not
 * exist - both are indistinguishable to the caller by design, so a probe cannot
 * confirm whether another tenant's project exists.
 *
 * Cached per request so the many permission checks a single action performs
 * collapse to one query.
 */
export const getEffectiveProjectRoleDAL = cache(
	async (projectId: string): Promise<RoleAccess | null> => {
		const user = await getCurrentUser();
		if (!user) return null;

		const ownerBranch = db
			.select({ role: sql<string>`'owner'`.as("role") })
			.from(projects)
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);

		const directBranch = db
			.select({ role: sql<string>`${projectMembers.accessLevel}`.as("role") })
			.from(projectMembers)
			.innerJoin(projects, eq(projectMembers.projectId, projects.id))
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, user.id),
					isNull(projectMembers.deletedAt),
					isNull(projects.deletedAt),
				),
			);

		// A soft-deleted team must stop granting access immediately, hence the
		// teams.deletedAt filter. TeamMembers is hard-deleted, so a missing row
		// already means no access and needs no filter of its own.
		const teamBranch = db
			.select({ role: sql<string>`${projectTeams.accessLevel}`.as("role") })
			.from(projectTeams)
			.innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
			.innerJoin(teams, eq(projectTeams.teamId, teams.id))
			.innerJoin(projects, eq(projectTeams.projectId, projects.id))
			.where(
				and(
					eq(projectTeams.projectId, projectId),
					eq(teamMembers.userId, user.id),
					isNull(teams.deletedAt),
					isNull(projects.deletedAt),
				),
			);

		try {
			const rows = await unionAll(ownerBranch, directBranch, teamBranch);
			return resolveEffectiveRole(rows.map((row) => row.role as RoleAccess));
		} catch (error) {
			throw new Error("Failed to resolve project access", { cause: error });
		}
	},
);

export async function verifyProjectPermissionDAL(
	projectId: string,
	permission: Permission,
): Promise<boolean> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	return role ? hasPermission(role, permission) : false;
}

/**
 * Whether the current user belongs to a workspace, as owner or active member.
 *
 * Workspace administration is intentionally binary - WorkspaceMembers carries no
 * role column - so this is a membership check, not a permission check.
 */
export const verifyWorkspaceMembershipDAL = cache(
	async (workspaceId: string): Promise<boolean> => {
		const user = await getCurrentUser();
		if (!user) return false;

		try {
			const [owned] = await db
				.select({ id: workspaces.id })
				.from(workspaces)
				.where(
					and(
						eq(workspaces.id, workspaceId),
						eq(workspaces.ownerId, user.id),
						isNull(workspaces.deletedAt),
					),
				);

			if (owned) return true;

			const [member] = await db
				.select({ id: workspaceMembers.id })
				.from(workspaceMembers)
				.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
				.where(
					and(
						eq(workspaceMembers.workspaceId, workspaceId),
						eq(workspaceMembers.userId, user.id),
						eq(workspaceMembers.status, "active"),
						isNull(workspaceMembers.deletedAt),
						isNull(workspaces.deletedAt),
					),
				);

			return Boolean(member);
		} catch (error) {
			throw new Error("Failed to verify workspace membership", {
				cause: error,
			});
		}
	},
);
