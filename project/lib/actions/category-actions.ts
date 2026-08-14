"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	deleteWorkspaceCategoryDAL,
	getWorkspaceCategoryStylesDAL,
	updateWorkspaceCategoryDAL,
	upsertWorkspaceCategoryDAL,
} from "@/lib/dal/categories";

const categoryTypeSchema = z.enum(["project", "task"]);
const categorySchema = z.object({
	name: z.string().min(1, "Category name is required").trim(),
	type: categoryTypeSchema,
	color: z.string().optional(),
});

export async function getCategoriesAction(
	workspaceId: string,
	type: "project" | "task",
) {
	const user = await getCurrentUser();
	if (!user) {
		return { success: false, error: "Unauthorized" };
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
		return { success: false, error: "Unauthorized" };
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
		return { success: false, error: "Unauthorized" };
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
		return { success: false, error: "Unauthorized" };
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
