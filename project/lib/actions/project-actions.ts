"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import {
	bulkArchiveProjectsInDB,
	bulkDeleteProjectsInDB,
	createProjectInDB,
	deleteProjectInDB,
	updateProjectInDB,
} from "@/lib/dal/projects";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import {
	createProjectSchema,
	editProjectSchema,
} from "@/lib/validations/project-schema";

export async function createProjectAction(
	workspaceId: string,
	formData: FormData,
): Promise<{ success: boolean; data?: ProjectOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		// Parse
		const rawData = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			startDate: formData.get("startDate"),
			dueDate: formData.get("dueDate"),
			status: formData.get("status"),
			priority: formData.get("priority"),
		};

		// ZOD
		const validationResult = createProjectSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		// DAL Call
		const statusValue = data.status || "active";

		const newProject = await createProjectInDB({
			workspaceId,
			ownerId: user.id,
			name: data.title,
			description: data.description || null,
			category: data.category || null,
			startDate: data.startDate ? new Date(data.startDate) : null,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: statusValue,
			priority: data.priority || "medium",
		});

		// Cache Revalidation
		revalidatePath("/projects");

		// Return DTO Payload
		return { success: true, data: newProject };
	} catch (error) {
		console.error("createProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateProjectAction(
	projectId: string,
	formData: FormData,
): Promise<{ success: boolean; data?: ProjectOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_project",
		);
		if (!hasPermission) {
			return { success: false, error: "Unauthorized" };
		}

		const rawData = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			startDate: formData.get("startDate"),
			dueDate: formData.get("dueDate"),
			status: formData.get("status"),
			priority: formData.get("priority"),
		};

		const validationResult = editProjectSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		const updatedProject = await updateProjectInDB(projectId, {
			name: data.title,
			description: data.description,
			category: data.category,
			startDate: data.startDate ? new Date(data.startDate) : null,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: data.status,
			priority: data.priority,
		});

		revalidatePath("/projects");
		revalidatePath(`/projects/${projectId}`);

		return { success: true, data: updatedProject };
	} catch (error) {
		console.error("updateProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteProjectAction(
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"delete_project",
		);
		if (!hasPermission) {
			return { success: false, error: "Unauthorized" };
		}

		await deleteProjectInDB(projectId);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("deleteProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkDeleteProjectsAction(
	projectIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		// Verify permission for all projects (or fast-fail on first unauthorized)
		for (const id of projectIds) {
			const hasPermission = await verifyProjectPermissionDAL(
				id,
				"delete_project",
			);
			if (!hasPermission) {
				return {
					success: false,
					error: "Unauthorized to delete one or more projects",
				};
			}
		}

		await bulkDeleteProjectsInDB(projectIds);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("bulkDeleteProjectsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkArchiveProjectsAction(
	projectIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		for (const id of projectIds) {
			const hasPermission = await verifyProjectPermissionDAL(
				id,
				"edit_project",
			);
			if (!hasPermission) {
				return {
					success: false,
					error: "Unauthorized to archive one or more projects",
				};
			}
		}

		await bulkArchiveProjectsInDB(projectIds);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("bulkArchiveProjectsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
