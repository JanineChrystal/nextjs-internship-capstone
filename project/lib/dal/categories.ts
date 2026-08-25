import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { categories, projects, tasks } from "@/lib/db/schema";
import type { CategoryType } from "@/lib/types/category";

/**
 * resolve workspace context - determines the authoritative workspace
 * for a category operation via backend resolution, ignoring
 * client-provided IDs to prevent unauthorized cross-tenant data access.
 */
export async function resolveWorkspaceIdDAL(
	workspaceId: string,
): Promise<string> {
	const workspace = await resolveActiveWorkspaceDAL(workspaceId);
	return workspace.id;
}

/**
 * resolve project workspace context - retrieves the parent workspace
 * of a project to ensure task categories are registered to the project's
 * tenant, rather than the individual editor's workspace.
 */
export async function resolveProjectWorkspaceIdDAL(
	projectId: string,
): Promise<string> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	const [project] = await db
		.select({ workspaceId: projects.workspaceId })
		.from(projects)
		.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

	if (!project) throw new Error("Project not found");

	return project.workspaceId;
}

export async function getUniqueTaskCategoriesDAL(
	projectId: string,
): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/**
	 * central access resolution - authorizes task category reads via
	 * project roles rather than ownership, allowing all project members
	 * to see active categories.
	 */
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const results = await db
			.selectDistinct({ category: tasks.category })
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.where(
				and(
					eq(tasks.projectId, projectId),
					isNull(tasks.deletedAt),
					isNull(projects.deletedAt),
					isNotNull(tasks.category),
				),
			);
		return results.map((row) => row.category as string).filter(Boolean);
	} catch (error) {
		throw new Error("Failed to fetch task categories", { cause: error });
	}
}

export async function getUniqueProjectCategoriesDAL(): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.selectDistinct({ category: projects.category })
			.from(projects)
			.where(
				and(
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
					isNotNull(projects.category),
				),
			);
		return results.map((row) => row.category as string).filter(Boolean);
	} catch (error) {
		throw new Error("Failed to fetch project categories", { cause: error });
	}
}

// fetch workspace categories - retrieves all categories of a given type within a resolved workspace context.
export async function getWorkspaceCategoryStylesDAL(
	workspaceId: string,
	type: CategoryType,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const resolvedWorkspaceId = await resolveWorkspaceIdDAL(workspaceId);

	return db.query.categories.findMany({
		where: and(
			eq(categories.workspaceId, resolvedWorkspaceId),
			eq(categories.type, type),
		),
		orderBy: (categories, { asc }) => [asc(categories.name)],
	});
}

/**
 * get project category styles - retrieves styled categories specifically
 * from the project's parent workspace, ensuring members view the project's
 * shared categories instead of their own personal workspace's ones.
 */
export async function getProjectCategoryStylesDAL(
	projectId: string,
	type: CategoryType,
) {
	const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);

	return db.query.categories.findMany({
		where: and(
			eq(categories.workspaceId, workspaceId),
			eq(categories.type, type),
		),
		orderBy: (categories, { asc }) => [asc(categories.name)],
	});
}
