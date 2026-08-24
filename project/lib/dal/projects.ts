import "server-only";
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { db } from "@/lib/db";
import {
	boards,
	projectMembers,
	projects,
	projectTeams,
	tasks,
	teamMembers,
	teams,
	workspaces,
} from "@/lib/db/schema";
import { type ProjectOutputDTO, toProjectDTO } from "@/lib/dtos/project-dto";
import type { NewDbProject, ProjectStats } from "@/lib/types/project";

export async function createProjectInDB(
	data: NewDbProject,
): Promise<ProjectOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	if (data.ownerId !== user.clerkId && data.ownerId !== user.id) {
		throw new Error("Unauthorized: Cannot create project for another user");
	}

	try {
		return await db.transaction(async (tx) => {
			let activeWorkspaceId = data.workspaceId;

			// Resolve workspaceId if missing or a placeholder
			if (!activeWorkspaceId || activeWorkspaceId === "default") {
				const userWorkspaces = await tx
					.select()
					.from(workspaces)
					.where(eq(workspaces.ownerId, user.id));

				if (userWorkspaces.length > 0) {
					activeWorkspaceId = userWorkspaces[0].id;
				} else {
					throw new Error("No active workspace found for user");
				}
			}

			const [newProject] = await tx
				.insert(projects)
				.values({ ...data, workspaceId: activeWorkspaceId })
				.returning();

			// Hook B: Board Column Seeding
			await tx.insert(boards).values([
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "To Do",
					position: 0,
				},
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "In Progress",
					position: 1,
				},
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "Completed",
					position: 2,
				},
			]);

			return toProjectDTO(newProject);
		});
	} catch (error) {
		throw new Error("Failed to create project in database", { cause: error });
	}
}

export async function getProjectById(
	projectId: string,
): Promise<ProjectOutputDTO | null> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/**
	 * central access resolution - resolves access via all valid routes (direct,
	 * team, owner) and returns null on denial to uniformly trigger notFound()
	 * without exposing existence to unauthorized users.
	 */
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) return null;

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

		if (!project) return null;

		return toProjectDTO(project);
	} catch (error) {
		throw new Error("Failed to fetch project from database", { cause: error });
	}
}

export async function getProjectsByWorkspaceId(
	workspaceId: string,
): Promise<ProjectOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(projects)
			.where(
				and(
					eq(projects.workspaceId, workspaceId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);

		return results.map(toProjectDTO);
	} catch (error) {
		throw new Error("Failed to fetch projects from database", { cause: error });
	}
}

/**
 * get all user projects - retrieves all projects accessible via ownership,
 * direct membership, or team membership. Caches per request as it serves
 * as the primary scoping primitive for other DAL reads. Supports a 'scope'
 * string ('live' or 'all') to correctly include trashed projects for archive
 * views without busting the cache with object references.
 */
export type ProjectScope = "live" | "all";

export const getAllUserProjectsDAL = cache(
	async (scope: ProjectScope = "live"): Promise<ProjectOutputDTO[]> => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Unauthorized");

		/** scope visibility - relaxes deletion filters for the 'all' scope to allow the archive page to see trashed projects. */
		const visibility =
			scope === "live"
				? and(isNull(projects.archivedAt), isNull(projects.deletedAt))
				: undefined;

		try {
			const [owned, direct, viaTeams] = await Promise.all([
				db
					.select()
					.from(projects)
					.where(and(eq(projects.ownerId, user.id), visibility)),

				db
					.select({ project: projects })
					.from(projectMembers)
					.innerJoin(projects, eq(projectMembers.projectId, projects.id))
					.where(
						and(
							eq(projectMembers.userId, user.id),
							isNull(projectMembers.deletedAt),
							visibility,
						),
					),

				db
					.select({ project: projects })
					.from(teamMembers)
					.innerJoin(projectTeams, eq(teamMembers.teamId, projectTeams.teamId))
					.innerJoin(teams, eq(teamMembers.teamId, teams.id))
					.innerJoin(projects, eq(projectTeams.projectId, projects.id))
					.where(
						and(
							eq(teamMembers.userId, user.id),
							isNull(teams.deletedAt),
							visibility,
						),
					),
			]);

			/** deduplicate projects - ensures projects accessible via multiple routes (e.g., owner and team) appear only once. */
			const byId = new Map<string, (typeof owned)[number]>();
			for (const project of owned) byId.set(project.id, project);
			for (const row of direct) byId.set(row.project.id, row.project);
			for (const row of viaTeams) byId.set(row.project.id, row.project);

			return Array.from(byId.values()).map(toProjectDTO);
		} catch (error) {
			throw new Error("Failed to fetch user projects from database", {
				cause: error,
			});
		}
	},
);

/**
 * get project stats - retrieves aggregated task and member counts for all
 * accessible projects using constant-cost grouped queries, ensuring counts
 * match the visibility defined by getAllUserProjectsDAL.
 */
export async function getProjectStatsDAL(): Promise<Map<string, ProjectStats>> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/** resolve accessible ids - scopes the aggregation to accessible projects first to avoid an N+1 query problem. */
	const accessibleProjects = await getAllUserProjectsDAL();
	const projectIds = accessibleProjects.map((project) => project.id);

	if (projectIds.length === 0) return new Map<string, ProjectStats>();

	try {
		const [taskRows, memberRows] = await Promise.all([
			db
				.select({
					projectId: tasks.projectId,
					total: count(),
					completed: sql<number>`count(*) filter (where ${tasks.isCompleted})`,
				})
				.from(tasks)
				.innerJoin(projects, eq(tasks.projectId, projects.id))
				.where(
					and(
						inArray(tasks.projectId, projectIds),
						isNull(tasks.deletedAt),
						isNull(projects.deletedAt),
					),
				)
				.groupBy(tasks.projectId),
			db
				.select({
					projectId: projectMembers.projectId,
					total: count(),
				})
				.from(projectMembers)
				.innerJoin(projects, eq(projectMembers.projectId, projects.id))
				.where(
					and(
						inArray(projectMembers.projectId, projectIds),
						isNull(projectMembers.deletedAt),
						isNull(projects.deletedAt),
					),
				)
				.groupBy(projectMembers.projectId),
		]);

		const stats = new Map<string, ProjectStats>();

		for (const row of taskRows) {
			stats.set(row.projectId, {
				taskCount: Number(row.total),
				completedTaskCount: Number(row.completed),
				memberCount: 0,
			});
		}

		for (const row of memberRows) {
			const existing = stats.get(row.projectId);
			if (existing) {
				existing.memberCount = Number(row.total);
			} else {
				stats.set(row.projectId, {
					taskCount: 0,
					completedTaskCount: 0,
					memberCount: Number(row.total),
				});
			}
		}

		return stats;
	} catch (error) {
		throw new Error("Failed to fetch project stats from database", {
			cause: error,
		});
	}
}

export async function updateProjectInDB(
	projectId: string,
	data: Partial<NewDbProject>,
): Promise<ProjectOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		/**
		 * ID-only scope - relies on the action layer's prior permission check
		 * to authorize the update, avoiding an owner-only filter that would
		 * silently block permitted co-owners.
		 */
		const result = await db
			.update(projects)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
			.returning();

		if (result.length === 0) throw new Error("Project not found");

		return toProjectDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to update project in database", { cause: error });
	}
}

export async function deleteProjectInDB(projectId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		/** action gated - relies on the action layer's permission check for authorization before soft-deleting. */
		await db
			.update(projects)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));
	} catch (error) {
		throw new Error("Failed to delete project in database", { cause: error });
	}
}

export async function bulkDeleteProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)));
	} catch (error) {
		throw new Error("Failed to bulk delete projects in database", {
			cause: error,
		});
	}
}

export async function bulkArchiveProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({
				status: "archived",
				/** archive stamp - the archive page filters on archivedAt, not status, so both have to be written together or the project archives into nowhere. */
				archivedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)));
	} catch (error) {
		throw new Error("Failed to bulk archive projects in database", {
			cause: error,
		});
	}
}

export async function bulkCompleteProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ status: "completed", updatedAt: new Date() })
			.where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)));
	} catch (error) {
		throw new Error("Failed to bulk complete projects in database", {
			cause: error,
		});
	}
}
