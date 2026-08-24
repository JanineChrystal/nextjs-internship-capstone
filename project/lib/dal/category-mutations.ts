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

// default category color - slate-400 fallback matching the UI for uncolored categories.
const DEFAULT_CATEGORY_COLOR = "#94a3b8";

/**
 * category mutations - manages category writes and their necessary
 * cascades across tasks and projects. All operations strictly resolve
 * workspaces from session/project context rather than trusting client IDs.
 */

/**
 * update project category - renames a category within the project's
 * workspace and cascades the change to all referencing rows, authorized
 * via project roles.
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
 * delete project category - removes a category from the project's
 * workspace and gracefully falls back affected rows to 'Uncategorized',
 * authorized via project roles.
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
 * upsert category core - executes the upsert operation after authorization
 * and workspace resolution, shared by both workspace and project scoped
 * entry points.
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

// auto add workspace category - upserts a category into the caller's active workspace.
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
 * upsert project category - registers a category to the project's
 * parent workspace rather than the caller's personal workspace, ensuring
 * shared visibility. Authorized by project role to handle edge cases like
 * removed workspace members who retain project ownership.
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

// update workspace category - renames a category in the active workspace and triggers cascades.
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
 * update category core - executes the rename operation and cascades the
 * name change to all referencing tasks and projects within the resolved
 * workspace.
 */
async function updateCategoryInWorkspace(
	resolvedWorkspaceId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: CategoryType,
) {
	return await db.transaction(async (tx) => {
		// update base category - updates the core category record before cascading.
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

		// cascade update references - sweeps the new name across all matching projects or tasks in the workspace.
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
			// resolve workspace projects - gathers all project IDs within the workspace to scope the task update.
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

// delete workspace category - removes a category from the active workspace with graceful fallback.
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
 * delete category core - executes the deletion and gracefully falls back
 * affected tasks and projects to 'Uncategorized' within the resolved
 * workspace.
 */
async function deleteCategoryInWorkspace(
	resolvedWorkspaceId: string,
	categoryName: string,
	type: CategoryType,
) {
	return await db.transaction(async (tx) => {
		// fallback affected references - resets matching projects or tasks to Uncategorized before deletion.
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

		// delete base category - removes the core category record after references are secured.
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
