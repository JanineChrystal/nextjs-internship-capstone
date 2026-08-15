"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import {
	createCommentInDB,
	deleteCommentInDB,
	getCommentsByTaskId,
	updateCommentInDB,
} from "@/lib/dal/comments";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import {
	CreateCommentSchema,
	UpdateCommentSchema,
} from "@/lib/validations/comment-schema";

export async function getCommentsAction(
	taskId: string,
	projectId: string,
): Promise<{ success: boolean; data?: CommentOutputDTO[]; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"view_project",
		);
		if (!hasPermission) return { success: false, error: "Unauthorized" };

		const comments = await getCommentsByTaskId(taskId, projectId);
		return { success: true, data: comments };
	} catch (error) {
		console.error("getCommentsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function createCommentAction(
	taskId: string,
	projectId: string,
	body: string,
	parentId?: string,
): Promise<{ success: boolean; data?: CommentOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"comment_task",
		);
		if (!hasPermission) return { success: false, error: "Unauthorized" };

		const validationResult = CreateCommentSchema.safeParse({ body, parentId });
		if (!validationResult.success) {
			return { success: false, error: "Invalid comment" };
		}

		const comment = await createCommentInDB(
			taskId,
			projectId,
			user.id,
			validationResult.data.body,
			validationResult.data.parentId,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: comment };
	} catch (error) {
		console.error("createCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateCommentAction(
	commentId: string,
	projectId: string,
	body: string,
): Promise<{ success: boolean; data?: CommentOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const validationResult = UpdateCommentSchema.safeParse({ body });
		if (!validationResult.success) {
			return { success: false, error: "Invalid comment" };
		}

		const comment = await updateCommentInDB(
			commentId,
			user.id,
			validationResult.data.body,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: comment };
	} catch (error) {
		console.error("updateCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteCommentAction(
	commentId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const canModerate = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);

		await deleteCommentInDB(commentId, user.id, canModerate);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
