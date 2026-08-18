import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { categories, projects, tasks } from "@/lib/db/schema";
import type { CategoryType } from "@/lib/types/category";

/**
 * The workspace a category operation should act on.
 *
 * Delegates to resolveActiveWorkspaceDAL rather than trusting the id it is
 * given: these ids arrive from client components, and the previous version
 * returned any non-"default" value verbatim, so a crafted id could read or
 * rename another tenant's categories.
 */
export async function resolveWorkspaceIdDAL(
	workspaceId: string,
): Promise<string> {
	const workspace = await resolveActiveWorkspaceDAL(workspaceId);
	return workspace.id;
}

/**
 * The workspace that owns a project, for categories set on that project's tasks.
 *
 * A task category belongs to the project's workspace, not to whoever happens to
 * be editing. Resolving it from the editor meant a member styling a task in
 * someone else's project created the Categories row in their own workspace, so
 * the project owner never saw the colour.
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

	// Access resolved centrally rather than by owner, so members of the project
	// see the categories in use on it.
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

// Fetch Categories
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
 * The styled categories belonging to a project's workspace.
 *
 * The task modal used the workspace-scoped read with the "default" placeholder,
 * which resolves the *viewer's* workspace - so a member opening a task in
 * someone else's project saw an empty dropdown, and any category they typed was
 * the only one they could then see or manage.
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
