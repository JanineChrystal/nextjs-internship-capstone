"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	getProjectCategoryStylesDAL,
	getWorkspaceCategoryStylesDAL,
} from "@/lib/dal/categories";
import {
	deleteProjectCategoryDAL,
	deleteWorkspaceCategoryDAL,
	updateProjectCategoryDAL,
	updateWorkspaceCategoryDAL,
	upsertProjectCategoryDAL,
	upsertWorkspaceCategoryDAL,
} from "@/lib/dal/category-mutations";

const categoryTypeSchema = z.enum(["project", "task"]);
const categorySchema = z.object({
	name: z.string().min(1, "Category name is required").trim(),
	type: categoryTypeSchema,
	color: z.string().optional(),
});

/**
 * Project-scoped category actions.
 *
 * The task modal must read and write the categories of the workspace that owns
 * the *project*, not the caller's own workspace. Passing the "default"
 * placeholder resolved the viewer's workspace, so a member opening a task in a
 * shared project saw an empty dropdown.
 *
 * Authorisation lives in the DAL, which gates every one of these on
 * getEffectiveProjectRoleDAL.
 */
export async function getProjectCategoriesAction(
	projectId: string,
	type: "project" | "task",
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const categories = await getProjectCategoryStylesDAL(projectId, type);
		return { success: true, data: categories };
	} catch (error: unknown) {
		console.error("getProjectCategoriesAction error:", error);
		return { success: false, error: "Failed to load categories" };
	}
}

export async function createProjectCategoryAction(
	projectId: string,
	name: string,
	type: "project" | "task",
	color?: string,
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = categorySchema.safeParse({ name, type, color });
		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error.issues[0]?.message,
			};
		}

		const newCategory = await upsertProjectCategoryDAL(
			projectId,
			validationResult.data.name,
			validationResult.data.type,
			validationResult.data.color,
		);

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: newCategory };
	} catch (error: unknown) {
		console.error("createProjectCategoryAction error:", error);
		return { success: false, error: "Failed to create category" };
	}
}

export async function updateProjectCategoryAction(
	projectId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: "project" | "task",
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = categorySchema.safeParse({
			name: newName,
			type,
			color: newColor,
		});
		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error.issues[0]?.message,
			};
		}

		if (!oldName) {
			return { success: false, error: "Old category name is required" };
		}

		const updated = await updateProjectCategoryDAL(
			projectId,
			oldName,
			validationResult.data.name,
			newColor,
			validationResult.data.type,
		);

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: updated };
	} catch (error: unknown) {
		console.error("updateProjectCategoryAction error:", error);
		return { success: false, error: "Failed to update category" };
	}
}

export async function deleteProjectCategoryAction(
	projectId: string,
	categoryName: string,
	type: "project" | "task",
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: await getSessionFailureReason() };
		}

		if (!categoryName) {
			return { success: false, error: "Category name is required" };
		}

		await deleteProjectCategoryDAL(projectId, categoryName, type);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error: unknown) {
		console.error("deleteProjectCategoryAction error:", error);
		return { success: false, error: "Failed to delete category" };
	}
}

export async function getCategoriesAction(
	workspaceId: string,
	type: "project" | "task",
) {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: await getSessionFailureReason() };
	}

	try {
		const categories = await getWorkspaceCategoryStylesDAL(workspaceId, type);
		return { success: true, data: categories };
	} catch (error: unknown) {
		console.error("getCategoriesAction error:", error);
		const message =
			error instanceof Error ? error.message : "An unexpected error occurred";
		return { success: false, error: message };
	}
}

export async function createCategoryAction(
	workspaceId: string,
	name: string,
	type: "project" | "task",
	color?: string,
) {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: await getSessionFailureReason() };
	}

	const validationResult = categorySchema.safeParse({ name, type, color });
	if (!validationResult.success) {
		return { success: false, error: validationResult.error.issues[0]?.message };
	}

	try {
		const newCategory = await upsertWorkspaceCategoryDAL(
			workspaceId,
			validationResult.data.name,
			validationResult.data.type,
			validationResult.data.color,
		);
		revalidatePath("/projects");
		return { success: true, data: newCategory };
	} catch (error: unknown) {
		console.error("createCategoryAction error:", error);
		const message =
			error instanceof Error ? error.message : "An unexpected error occurred";
		return { success: false, error: message };
	}
}

export async function updateCategoryAction(
	workspaceId: string,
	oldName: string,
	newName: string,
	newColor: string,
	type: "project" | "task",
) {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: await getSessionFailureReason() };
	}

	const validationResult = categorySchema.safeParse({
		name: newName,
		type,
		color: newColor,
	});
	if (!validationResult.success) {
		return { success: false, error: validationResult.error.issues[0]?.message };
	}

	if (!oldName) {
		return { success: false, error: "Old category name is required" };
	}

	try {
		const updatedCategory = await updateWorkspaceCategoryDAL(
			workspaceId,
			oldName,
			validationResult.data.name,
			newColor,
			validationResult.data.type,
		);
		revalidatePath("/projects");
		return { success: true, data: updatedCategory };
	} catch (error: unknown) {
		console.error("updateCategoryAction error:", error);
		const message =
			error instanceof Error ? error.message : "An unexpected error occurred";
		return { success: false, error: message };
	}
}

export async function deleteCategoryAction(
	workspaceId: string,
	categoryName: string,
	type: "project" | "task",
) {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: await getSessionFailureReason() };
	}

	if (!categoryName) {
		return { success: false, error: "Category name is required" };
	}

	try {
		await deleteWorkspaceCategoryDAL(workspaceId, categoryName, type);
		revalidatePath("/projects");
		return { success: true };
	} catch (error: unknown) {
		console.error("deleteCategoryAction error:", error);
		const message =
			error instanceof Error ? error.message : "An unexpected error occurred";
		return { success: false, error: message };
	}
}
