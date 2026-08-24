import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { cache } from "react";
import { hasPermission, resolveEffectiveRole } from "@/lib/config/permissions";
import { getCurrentUser } from "@/lib/dal/auth";
import type { ProjectScope } from "@/lib/dal/projects";
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
 * get effective project role - resolves a user's highest-ranked access
 * level across ownership, direct membership, and team membership in a
 * single round trip. Incorporates a 'scope' parameter to correctly
 * authorize actions on trashed projects, and caches per request to
 * optimize multi-check actions.
 */
export const getEffectiveProjectRoleDAL = cache(
	async (
		projectId: string,
		scope: ProjectScope = "live",
	): Promise<RoleAccess | null> => {
		const user = await getCurrentUser();
		if (!user) return null;

		/**
		 * visibility resolution - relaxes project deletion filters for the
		 * 'all' scope, but strictly maintains revocation filters (deleted
		 * memberships/teams) to prevent unauthorized access to archived items.
		 */
		const projectVisibility =
			scope === "live" ? isNull(projects.deletedAt) : undefined;

		const ownerBranch = db
			.select({ role: sql<string>`'owner'`.as("role") })
			.from(projects)
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.ownerId, user.id),
					projectVisibility,
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
					projectVisibility,
				),
			);

		/**
		 * team revocation filter - strictly filters out soft-deleted teams to
		 * instantly revoke access, relying on hard deletion for TeamMembers.
		 */
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
					projectVisibility,
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

/**
 * get effective project roles - retrieves governing roles for all accessible
 * projects via three bulk queries, eliminating the N+1 problem inherent in
 * calling the single-project resolver repeatedly.
 */
export const getEffectiveProjectRolesDAL = cache(
	async (): Promise<Map<string, RoleAccess>> => {
		const user = await getCurrentUser();
		if (!user) return new Map();

		try {
			const [owned, direct, viaTeams] = await Promise.all([
				db
					.select({ projectId: projects.id })
					.from(projects)
					.where(
						and(eq(projects.ownerId, user.id), isNull(projects.deletedAt)),
					),

				db
					.select({
						projectId: projectMembers.projectId,
						role: projectMembers.accessLevel,
					})
					.from(projectMembers)
					.innerJoin(projects, eq(projectMembers.projectId, projects.id))
					.where(
						and(
							eq(projectMembers.userId, user.id),
							isNull(projectMembers.deletedAt),
							isNull(projects.deletedAt),
						),
					),

				/**
				 * team revocation filter - strictly filters out soft-deleted teams to
				 * instantly revoke access, aligning with single-project resolution.
				 */
				db
					.select({
						projectId: projectTeams.projectId,
						role: projectTeams.accessLevel,
					})
					.from(projectTeams)
					.innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
					.innerJoin(teams, eq(projectTeams.teamId, teams.id))
					.innerJoin(projects, eq(projectTeams.projectId, projects.id))
					.where(
						and(
							eq(teamMembers.userId, user.id),
							isNull(teams.deletedAt),
							isNull(projects.deletedAt),
						),
					),
			]);

			const routes = new Map<string, RoleAccess[]>();
			const add = (projectId: string, role: RoleAccess) => {
				const existing = routes.get(projectId);
				if (existing) existing.push(role);
				else routes.set(projectId, [role]);
			};

			for (const row of owned) add(row.projectId, "owner");
			for (const row of direct) add(row.projectId, row.role as RoleAccess);
			for (const row of viaTeams) add(row.projectId, row.role as RoleAccess);

			const resolved = new Map<string, RoleAccess>();
			for (const [projectId, held] of routes) {
				const role = resolveEffectiveRole(held);
				if (role) resolved.set(projectId, role);
			}

			return resolved;
		} catch (error) {
			throw new Error("Failed to resolve project access", { cause: error });
		}
	},
);

/**
 * verify project permission - evaluates a specific permission against the
 * user's effective role, passing the scope parameter through to support
 * archive operations.
 */
export async function verifyProjectPermissionDAL(
	projectId: string,
	permission: Permission,
	scope: ProjectScope = "live",
): Promise<boolean> {
	const role = await getEffectiveProjectRoleDAL(projectId, scope);
	return role ? hasPermission(role, permission) : false;
}

/**
 * verify workspace membership - determines if the user is an owner or
 * active member of a workspace, functioning as a binary access check
 * since workspaces lack granular roles.
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
