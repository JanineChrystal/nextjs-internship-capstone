"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ProjectCompletedEmail } from "@/app/(dashboard)/notifications/_components/email/project-completed-email";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	upsertProjectCategoryDAL,
	upsertWorkspaceCategoryDAL,
} from "@/lib/dal/category-mutations";
import {
	getEffectiveProjectRoleDAL,
	verifyProjectPermissionDAL,
} from "@/lib/dal/permissions";
import { getProjectMembersDAL } from "@/lib/dal/project-members";
import {
	bulkArchiveProjectsInDB,
	bulkCompleteProjectsInDB,
	bulkDeleteProjectsInDB,
	createProjectInDB,
	deleteProjectInDB,
	updateProjectInDB,
} from "@/lib/dal/projects";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import { sendNotification } from "@/lib/email/send-notification";
import { getAppBaseUrl } from "@/lib/utils/app-url";
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

		/**
		 * parse form data - extracts values from the incoming form data
		 * request.
		 */
		const rawData = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			startDate: formData.get("startDate"),
			dueDate: formData.get("dueDate"),
			status: formData.get("status"),
			priority: formData.get("priority"),
		};

		/**
		 * validate form data - validates the parsed values using zod
		 * schema.
		 */
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

		/**
		 * cache revalidation - triggers a cache revalidation for the
		 * projects page.
		 */
		revalidatePath("/projects");

		/** return dto payload - returns the newly created project data. */
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

		/**
		 * enforce owner archiving - restricts the archive action strictly
		 * to the project owner to prevent unauthorized archiving by
		 * co-owners.
		 */
		if (data.status === "archived") {
			const role = await getEffectiveProjectRoleDAL(projectId);
			if (role !== "owner") {
				return {
					success: false,
					error: "Only the project owner can archive this project",
				};
			}
		}

		/**
		 * update project category - upserts the category into the workspace
		 * via the DAL which safely resolves workspace ownership.
		 */
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
		/**
		 * verify bulk delete permissions - checks authorization for all
		 * selected projects and fails immediately if any check fails.
		 */
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

		/**
		 * record bulk completion activity - records completion activity
		 * here instead of the DAL as actions have the context to resolve
		 * workspace and member details.
		 */
		const user = await getCurrentUser();
		if (user) {
			for (const projectId of projectIds) {
				await recordProjectCompletion(projectId, user);
			}
		}

		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("bulkCompleteProjectsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/**
 * record project completion - records the completion activity and
 * asynchronously emails all project members without risking the
 * success of the bulk operation.
 */
async function recordProjectCompletion(
	projectId: string,
	actor: {
		id: string;
		firstName: string | null;
		lastName: string | null;
		email: string;
	},
): Promise<void> {
	try {
		const [project] = await db
			.select({ name: projects.name, workspaceId: projects.workspaceId })
			.from(projects)
			.where(eq(projects.id, projectId));

		if (!project) return;

		const members = await getProjectMembersDAL(projectId);

		const recorded = await recordActivity({
			workspaceId: project.workspaceId,
			actorId: actor.id,
			actionType: "PROJECT_COMPLETED",
			details: `Marked "${project.name}" complete`,
			projectId,
			notify: members.map((member) => ({
				recipientId: member.userId,
				message: `A project you are part of was completed`,
			})),
		});

		const mayEmail = recorded.filter((entry) => entry.shouldSendEmail);
		if (mayEmail.length === 0) return;

		const recipients = await db
			.select({ email: users.email })
			.from(users)
			.where(
				inArray(
					users.id,
					mayEmail.map((entry) => entry.recipientId),
				),
			);

		const completedBy = actor.firstName
			? `${actor.firstName} ${actor.lastName || ""}`.trim()
			: actor.email;

		after(async () => {
			for (const recipient of recipients) {
				await sendNotification({
					to: recipient.email,
					subject: `${project.name} was marked complete`,
					/**
					 * verified notification dispatch - sends emails only to members who
					 * passed the notification preferences check in recordActivity.
					 */
					shouldSend: true,
					template: ProjectCompletedEmail({
						completedBy,
						projectName: project.name,
						projectUrl: `${getAppBaseUrl()}/projects/${projectId}`,
					}),
				});
			}
		});
	} catch (error) {
		console.error("Failed to record project completion:", error);
	}
}
