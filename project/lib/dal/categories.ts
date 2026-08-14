import "server-only";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { categories, projects, tasks, workspaces } from "@/lib/db/schema";

type CategoryType = "project" | "task";

async function resolveWorkspaceId(
	workspaceId: string,
	userId: string,
): Promise<string> {
	if (workspaceId && workspaceId !== "default") {
		return workspaceId;
	}

	const userWorkspaces = await db
		.select()
		.from(workspaces)
		.where(and(eq(workspaces.ownerId, userId), isNull(workspaces.deletedAt)));

	if (userWorkspaces.length > 0) {
		return userWorkspaces[0].id;
	}

	throw new Error("No active workspace found for user");
}

export async function getUniqueTaskCategoriesDAL(
	projectId: string,
): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.selectDistinct({ category: tasks.category })
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.where(
				and(
					eq(tasks.projectId, projectId),
					eq(projects.ownerId, user.id),
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

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);

	return db.query.categories.findMany({
		where: and(
			eq(categories.workspaceId, resolvedWorkspaceId),
			eq(categories.type, type),
		),
		orderBy: (categories, { asc }) => [asc(categories.name)],
	});
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

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);

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

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);

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

	const resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);

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
