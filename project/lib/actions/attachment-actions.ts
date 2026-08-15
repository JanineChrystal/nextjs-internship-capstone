"use server";

import { revalidatePath } from "next/cache";
import {
	createAttachmentInDB,
	deleteAttachmentInDB,
} from "@/lib/dal/attachments";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import type { AttachmentOutputDTO } from "@/lib/dtos/task-dto";
import { CreateAttachmentSchema } from "@/lib/validations/attachment-schema";

export async function createAttachmentAction(
	taskId: string,
	projectId: string,
	inputData: { name: string; url: string; type: "file" | "link" },
): Promise<{ success: boolean; data?: AttachmentOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) return { success: false, error: "Unauthorized" };

		const validationResult = CreateAttachmentSchema.safeParse(inputData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid attachment data" };
		}

		const attachment = await createAttachmentInDB(
			taskId,
			projectId,
			validationResult.data,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: attachment };
	} catch (error) {
		console.error("createAttachmentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteAttachmentAction(
	attachmentId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) return { success: false, error: "Unauthorized" };

		await deleteAttachmentInDB(attachmentId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteAttachmentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
