import "server-only";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { categories, projects, tasks } from "@/lib/db/schema";

type CategoryType = "project" | "task";

/**
 * The workspace a category operation should act on.
 *
 * Delegates to resolveActiveWorkspaceDAL rather than trusting the id it is
 * given: these ids arrive from client components, and the previous version
 * returned any non-"default" value verbatim, so a crafted id could read or
 * rename another tenant's categories.
 */
async function resolveWorkspaceId(workspaceId: string): Promise<string> {
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

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId);

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

/**
 * Renames a category across the project's workspace, cascading to the rows that
 * reference it by name. Mirrors updateWorkspaceCategoryDAL but authorised by
 * project role.
 */
export async function updateProjectCategoryDAL(
	projectId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: CategoryType,
) {
	const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);
	return updateCategoryInWorkspace(
		workspaceId,
		oldName,
		newName,
		newColor,
		type,
	);
}

/**
 * Deletes a category from the project's workspace, falling the affected rows
 * back to "Uncategorized". Authorised by project role.
 */
export async function deleteProjectCategoryDAL(
	projectId: string,
	categoryName: string,
	type: CategoryType,
) {
	const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);
	return deleteCategoryInWorkspace(workspaceId, categoryName, type);
}

// Upsert Category (Auto-add)
export async function upsertWorkspaceCategoryDAL(
	workspaceId: string,
	name: string,
	type: CategoryType,
	color?: string,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId);

	const existing = await db.query.categories.findFirst({
		where: and(
			eq(categories.workspaceId, resolvedWorkspaceId),
			eq(categories.type, type),
			eq(categories.name, name),
		),
	});

	if (existing) {
		return existing;
	}

	const [newCategory] = await db
		.insert(categories)
		.values({
			workspaceId: resolvedWorkspaceId,
			name,
			type,
			color: color || "#94a3b8", // Fallback color
		})
		.returning();

	return newCategory;
}

/**
 * Registers a category against the workspace that owns a given project.
 *
 * Separate from upsertWorkspaceCategoryDAL because the two answer "which
 * workspace?" differently. That one resolves the *caller's* workspace, which is
 * right when creating a project but wrong for anything scoped to an existing
 * one: a member styling a task in a shared project would file the category in
 * their own workspace, where the project owner never sees it.
 *
 * Authorised by project role rather than workspace membership, so a co-owner
 * whose directory entry was later removed can still edit the project they were
 * given access to.
 */
export async function upsertProjectCategoryDAL(
	projectId: string,
	name: string,
	type: CategoryType,
	color?: string,
) {
	const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);

	const existing = await db.query.categories.findFirst({
		where: and(
			eq(categories.workspaceId, workspaceId),
			eq(categories.type, type),
			eq(categories.name, name),
		),
	});

	if (existing) return existing;

	const [newCategory] = await db
		.insert(categories)
		.values({
			workspaceId,
			name,
			type,
			color: color || "#94a3b8",
		})
		.returning();

	return newCategory;
}

// Update Category (Cascading)
export async function updateWorkspaceCategoryDAL(
	workspaceId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: CategoryType,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId);

	return updateCategoryInWorkspace(
		resolvedWorkspaceId,
		oldName,
		newName,
		newColor,
		type,
	);
}

/**
 * The rename itself, once a workspace has been resolved and authorised. Shared
 * by the workspace-scoped and project-scoped entry points so the cascade is
 * written once.
 */
async function updateCategoryInWorkspace(
	resolvedWorkspaceId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: CategoryType,
) {
	return await db.transaction(async (tx) => {
		// Update the category record
		const [updatedCategory] = await tx
			.update(categories)
			.set({
				name: newName,
				color: newColor,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(categories.workspaceId, resolvedWorkspaceId),
					eq(categories.type, type),
					eq(categories.name, oldName),
				),
			)
			.returning();

		if (!updatedCategory) {
			throw new Error("Category not found");
		}

		// Update associated projects or tasks
		if (type === "project") {
			await tx
				.update(projects)
				.set({
					category: newName,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(projects.workspaceId, resolvedWorkspaceId),
						eq(projects.category, oldName),
					),
				);
		} else if (type === "task") {
			// Find all tasks in this workspace where category matches
			const workspaceProjects = await tx.query.projects.findMany({
				where: eq(projects.workspaceId, resolvedWorkspaceId),
				columns: { id: true },
			});

			const projectIds = workspaceProjects.map((p) => p.id);

			if (projectIds.length > 0) {
				await tx
					.update(tasks)
					.set({
						category: newName,
						updatedAt: new Date(),
					})
					.where(
						and(
							inArray(tasks.projectId, projectIds),
							eq(tasks.category, oldName),
						),
					);
			}
		}

		return updatedCategory;
	});
}

// Delete Category (Graceful Fallback)
export async function deleteWorkspaceCategoryDAL(
	workspaceId: string,
	categoryName: string,
	type: CategoryType,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId);

	return deleteCategoryInWorkspace(resolvedWorkspaceId, categoryName, type);
}

/**
 * The delete-and-fall-back itself, once a workspace has been resolved and
 * authorised. Shared by both entry points.
 */
async function deleteCategoryInWorkspace(
	resolvedWorkspaceId: string,
	categoryName: string,
	type: CategoryType,
) {
	return await db.transaction(async (tx) => {
		// Update associated projects or tasks to "Uncategorized"
		if (type === "project") {
			await tx
				.update(projects)
				.set({
					category: "Uncategorized",
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(projects.workspaceId, resolvedWorkspaceId),
						eq(projects.category, categoryName),
					),
				);
		} else if (type === "task") {
			const workspaceProjects = await tx.query.projects.findMany({
				where: eq(projects.workspaceId, resolvedWorkspaceId),
				columns: { id: true },
			});

			const projectIds = workspaceProjects.map((p) => p.id);

			if (projectIds.length > 0) {
				await tx
					.update(tasks)
					.set({
						category: "Uncategorized",
						updatedAt: new Date(),
					})
					.where(
						and(
							inArray(tasks.projectId, projectIds),
							eq(tasks.category, categoryName),
						),
					);
			}
		}

		// Delete the category record
		await tx
			.delete(categories)
			.where(
				and(
					eq(categories.workspaceId, resolvedWorkspaceId),
					eq(categories.type, type),
					eq(categories.name, categoryName),
				),
			);
	});
}
