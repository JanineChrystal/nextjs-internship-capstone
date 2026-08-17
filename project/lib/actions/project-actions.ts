"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	upsertProjectCategoryDAL,
	upsertWorkspaceCategoryDAL,
} from "@/lib/dal/categories";
import {
	getEffectiveProjectRoleDAL,
	verifyProjectPermissionDAL,
} from "@/lib/dal/permissions";
import {
	assignTeamToProjectInDB,
	bulkArchiveProjectsInDB,
	bulkCompleteProjectsInDB,
	bulkDeleteProjectsInDB,
	createProjectInDB,
	deleteProjectInDB,
	getProjectMembersDetailedDAL,
	inviteUserToProjectInDB,
	type ProjectMemberDetailedOutputDTO,
	removeMemberFromProjectDAL,
	updateMemberJobRoleInDB,
	updateMemberRoleInDB,
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
			return { success: false, error: await getSessionFailureReason() };
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

		const statusValue = data.status || "active";

		const categoryValue = data.category || "Uncategorized";
		await upsertWorkspaceCategoryDAL(workspaceId, categoryValue, "project");

		const newProject = await createProjectInDB({
			workspaceId,
			ownerId: user.id,
			name: data.title,
			description: data.description || null,
			category: categoryValue,
			startDate: data.startDate ? new Date(`${data.startDate}:00.000Z`) : null,
			dueDate: data.dueDate ? new Date(`${data.dueDate}:00.000Z`) : null,
			status: statusValue,
			priority: data.priority || "medium",
		});

		// Cache Revalidation
		revalidatePath("/projects");

		// Return DTO Payload
		return { success: true, data: newProject };
	} catch (error: unknown) {
		console.error("createProjectAction error:", error);
		const message =
			error instanceof Error
				? error.cause
					? String(error.cause)
					: error.message
				: "An unexpected error occurred";
		return { success: false, error: message };
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
			return { success: false, error: await getSessionFailureReason() };
		}

		const rawData: Record<string, unknown> = {};
		if (formData.has("title")) rawData.title = formData.get("title");
		if (formData.has("description"))
			rawData.description = formData.get("description") || undefined;
		if (formData.has("category"))
			rawData.category = formData.get("category") || undefined;
		if (formData.has("startDate"))
			rawData.startDate = formData.get("startDate") || undefined;
		if (formData.has("dueDate"))
			rawData.dueDate = formData.get("dueDate") || undefined;
		if (formData.has("status")) rawData.status = formData.get("status");
		if (formData.has("priority")) rawData.priority = formData.get("priority");

		const validationResult = editProjectSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		// Archiving is a Danger Zone action and belongs to the owner alone, but it
		// travels through this generic update, so edit_project would otherwise let
		// a co-owner archive a project whose Danger Zone the UI hides from them.
		if (data.status === "archived") {
			const role = await getEffectiveProjectRoleDAL(projectId);
			if (role !== "owner") {
				return {
					success: false,
					error: "Only the project owner can archive this project",
				};
			}
		}

		// The category belongs to the workspace that owns this project, which the
		// DAL now resolves itself - replacing the inline dynamic imports and the
		// unverified workspace id that were doing that job here.
		if (data.category) {
			await upsertProjectCategoryDAL(projectId, data.category, "project");
		}

		const updatePayload: Record<string, unknown> = {};
		if (data.title !== undefined) updatePayload.name = data.title;
		if (data.description !== undefined)
			updatePayload.description = data.description;
		if (data.category !== undefined) updatePayload.category = data.category;
		if (data.startDate !== undefined)
			updatePayload.startDate = data.startDate
				? new Date(`${data.startDate}:00.000Z`)
				: null;
		if (data.dueDate !== undefined)
			updatePayload.dueDate = data.dueDate
				? new Date(`${data.dueDate}:00.000Z`)
				: null;
		if (data.status !== undefined) updatePayload.status = data.status;
		if (data.priority !== undefined) updatePayload.priority = data.priority;

		const updatedProject = await updateProjectInDB(projectId, updatePayload);

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
			return { success: false, error: await getSessionFailureReason() };
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

export async function bulkCompleteProjectsAction(
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
					error: "Unauthorized to complete one or more projects",
				};
			}
		}

		await bulkCompleteProjectsInDB(projectIds);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("bulkCompleteProjectsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function inviteUserToProjectAction(
	projectId: string,
	email: string,
	jobRole?: string,
	accessLevel?: "co-owner" | "member" | "guest",
): Promise<{ success: boolean; notice?: string; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const outcome = await inviteUserToProjectInDB(
			projectId,
			email,
			jobRole,
			accessLevel,
		);

		revalidatePath(`/projects/${projectId}`);

		// An address with no account is no longer a failure: the invitation is
		// stored and claimed on signup, so the caller is told what happened rather
		// than shown an error.
		if (outcome === "pending") {
			return {
				success: true,
				notice: `${email} has not signed up yet. The invite is saved and will apply when they do.`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("inviteUserToProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function getProjectMembersDetailedAction(
	projectId: string,
): Promise<{
	success: boolean;
	data?: ProjectMemberDetailedOutputDTO[];
	error?: string;
}> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"view_project",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const members = await getProjectMembersDetailedDAL(projectId);
		return { success: true, data: members };
	} catch (error) {
		console.error("getProjectMembersDetailedAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateMemberRoleAction(
	projectId: string,
	userId: string,
	accessLevel: "co-owner" | "member" | "guest",
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await updateMemberRoleInDB(projectId, userId, accessLevel);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("updateMemberRoleAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateMemberJobRoleAction(
	projectId: string,
	userId: string,
	jobRole: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await updateMemberJobRoleInDB(projectId, userId, jobRole);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("updateMemberJobRoleAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function removeMemberAction(
	projectId: string,
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"manage_members",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await removeMemberFromProjectDAL(projectId, userId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("removeMemberAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function assignTeamToProjectAction(
	projectId: string,
	teamId: string,
	accessLevel: "owner" | "co-owner" | "member" | "guest" = "member",
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_project",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await assignTeamToProjectInDB(projectId, teamId, accessLevel);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("assignTeamToProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
