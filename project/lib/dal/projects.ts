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

	// Access is resolved centrally so direct members and team members reach the
	// project too - an ownerId filter here would 404 anyone but the owner.
	// Returning null rather than throwing keeps notFound() behaving the same
	// whether the project is missing or merely invisible to this user.
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
 * Every project the user can reach: owned, joined directly, or joined through a
 * team.
 *
 * Previously filtered on ownerId alone, so anyone invited to a project simply
 * never saw it. The three routes mirror getEffectiveProjectRoleDAL exactly, so
 * a project can never be listed here yet deny access on open (or vice versa).
 *
 * Cached per request because it is now the scoping primitive for several other
 * reads (getProjectStatsDAL, getAllUserTasksDAL). Without this, one /projects
 * render issued the three-query fan-out twice.
 */
export const getAllUserProjectsDAL = cache(
	async (): Promise<ProjectOutputDTO[]> => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Unauthorized");

		try {
			const [owned, direct, viaTeams] = await Promise.all([
				db
					.select()
					.from(projects)
					.where(
						and(eq(projects.ownerId, user.id), isNull(projects.deletedAt)),
					),

				db
					.select({ project: projects })
					.from(projectMembers)
					.innerJoin(projects, eq(projectMembers.projectId, projects.id))
					.where(
						and(
							eq(projectMembers.userId, user.id),
							isNull(projectMembers.deletedAt),
							isNull(projects.deletedAt),
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
							isNull(projects.deletedAt),
						),
					),
			]);

			// A user holding several routes to the same project must see it once.
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
 * Aggregated per-project counts for every project the user can reach.
 *
 * Scoped to the same three access routes as getAllUserProjectsDAL rather than
 * ownership alone - otherwise a project appears in the list but its card shows
 * zero tasks and zero members, because the stats lookup simply missed it.
 *
 * Grouped queries rather than per-project lookups, so the cost stays constant
 * regardless of how many projects exist.
 */
export async function getProjectStatsDAL(): Promise<Map<string, ProjectStats>> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	// Resolve the accessible project ids first; aggregating per project would be
	// an N+1 across the whole list.
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
		// Scoped by id only: the action layer already gated this through
		// verifyProjectPermissionDAL, which resolves all three access routes. An
		// ownerId filter here would silently override that decision and make a
		// permitted co-owner's update match zero rows.
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
		// Gated by the action layer's permission check; see updateProjectInDB.
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
			.set({ status: "archived", updatedAt: new Date() })
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
