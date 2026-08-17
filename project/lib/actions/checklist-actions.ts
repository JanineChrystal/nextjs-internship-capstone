"use server";

import { revalidatePath } from "next/cache";
import { getSessionFailureReason } from "@/lib/dal/auth";
import {
	createChecklistItemInDB,
	deleteChecklistItemInDB,
	updateChecklistItemInDB,
} from "@/lib/dal/checklists";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import type { ChecklistOutputDTO } from "@/lib/dtos/task-dto";
import {
	CreateChecklistItemSchema,
	UpdateChecklistItemSchema,
} from "@/lib/validations/checklist-schema";

export async function createChecklistItemAction(
	taskId: string,
	projectId: string,
	title: string,
): Promise<{ success: boolean; data?: ChecklistOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission)
			return { success: false, error: await getSessionFailureReason() };

		const validationResult = CreateChecklistItemSchema.safeParse({ title });
		if (!validationResult.success) {
			return { success: false, error: "Invalid checklist item" };
		}

		const item = await createChecklistItemInDB(
			taskId,
			projectId,
			validationResult.data.title,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: item };
	} catch (error) {
		console.error("createChecklistItemAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateChecklistItemAction(
	itemId: string,
	projectId: string,
	updates: { title?: string; isCompleted?: boolean },
): Promise<{ success: boolean; data?: ChecklistOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission)
			return { success: false, error: await getSessionFailureReason() };

		const validationResult = UpdateChecklistItemSchema.safeParse(updates);
		if (!validationResult.success) {
			return { success: false, error: "Invalid checklist update" };
		}

		const item = await updateChecklistItemInDB(
			itemId,
			projectId,
			validationResult.data,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: item };
	} catch (error) {
		console.error("updateChecklistItemAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteChecklistItemAction(
	itemId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission)
			return { success: false, error: await getSessionFailureReason() };

		await deleteChecklistItemInDB(itemId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteChecklistItemAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
