import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	resolveProjectWorkspaceIdDAL,
	resolveWorkspaceIdDAL,
} from "@/lib/dal/categories";
import { db } from "@/lib/db";
import { categories, projects, tasks } from "@/lib/db/schema";
import type { CategoryType } from "@/lib/types/category";

// Slate-400. Matches what Manage Categories shows for a category nobody has
// given a colour yet.
const DEFAULT_CATEGORY_COLOR = "#94a3b8";

/**
 * Writes to the category table, and the cascades they trigger.
 *
 * Split from categories.ts, which read palettes and rewrote two other tables in
 * the same file. Renaming a category is not a category operation alone: because
 * tasks and projects reference categories by *name*, a rename has to sweep
 * Tasks.category and Projects.category too. That cascade is the risky part of
 * this domain and deserves to be read on its own.
 *
 * Every public function here resolves a workspace first, either from the
 * caller's session or from the project being edited, so no id from a client is
 * ever trusted verbatim.
 */

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

/**
 * The upsert itself, once a workspace has been resolved and authorised.
 *
 * Shared by the workspace-scoped and project-scoped entry points, which differ
 * only in how they answer "which workspace?" - the same split the rename and
 * delete paths already use.
 */
async function upsertCategoryInWorkspace(
	resolvedWorkspaceId: string,
	name: string,
	type: CategoryType,
	color?: string,
) {
	const existing = await db.query.categories.findFirst({
		where: and(
			eq(categories.workspaceId, resolvedWorkspaceId),
			eq(categories.type, type),
			eq(categories.name, name),
		),
	});

	if (existing) return existing;

	const [newCategory] = await db
		.insert(categories)
		.values({
			workspaceId: resolvedWorkspaceId,
			name,
			type,
			color: color || DEFAULT_CATEGORY_COLOR,
		})
		.returning();

	return newCategory;
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

	const resolvedWorkspaceId = await resolveWorkspaceIdDAL(workspaceId);
	return upsertCategoryInWorkspace(resolvedWorkspaceId, name, type, color);
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
	return upsertCategoryInWorkspace(workspaceId, name, type, color);
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

	const resolvedWorkspaceId = await resolveWorkspaceIdDAL(workspaceId);

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

	const resolvedWorkspaceId = await resolveWorkspaceIdDAL(workspaceId);

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
