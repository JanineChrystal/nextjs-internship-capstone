"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { z } from "zod";
import { TaskCompletedEmail } from "@/app/(dashboard)/notifications/_components/email/task-completed-email";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
import { upsertProjectCategoryDAL } from "@/lib/dal/category-mutations";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import { getTaskAssigneesByTaskIds } from "@/lib/dal/task-assignees";
import {
	bulkCompleteTasksInDB,
	bulkDeleteTasksInDB,
	createTaskInDB,
	deleteTaskInDB,
	getAllUserTasksDAL,
	getTasksByProjectId,
	moveTaskBoardDAL,
	reorderTasksInDB,
	updateTaskInDB,
} from "@/lib/dal/tasks";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import type {
	TaskOutputDTO,
	TaskWithBoardOutputDTO,
} from "@/lib/dtos/task-dto";
import { sendNotification } from "@/lib/email/send-notification";
import type { CreateTaskInput, NewDbTask } from "@/lib/types/task";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
	bulkUpdateTaskStatusSchema,
	insertTaskDbSchema,
	moveTaskSchema,
	updateTaskSchema,
} from "@/lib/validations/task-schema";

export async function getTasksAction(
	projectId: string,
): Promise<{ success: boolean; data?: TaskOutputDTO[]; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const tasks = await getTasksByProjectId(projectId);
		return { success: true, data: tasks };
	} catch (error) {
		console.error("getTasksAction error:", error);
		return { success: false, error: "Failed to fetch tasks" };
	}
}

export async function getAllUserTasksAction(): Promise<{
	success: boolean;
	data?: TaskWithBoardOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const tasks = await getAllUserTasksDAL();
		return { success: true, data: tasks };
	} catch (error) {
		console.error("getAllUserTasksAction error:", error);
		return { success: false, error: "Failed to fetch tasks" };
	}
}

export async function createTaskAction(
	projectId: string,
	boardId: string,
	inputData: CreateTaskInput,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		// Auth & Permission check
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"create_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		// Category is optional for the user - fall back to "Uncategorized"
		// rather than storing an empty string.
		const categoryValue = inputData.category?.trim() || "Uncategorized";

		// Parse payload
		const rawData = {
			projectId,
			boardId,
			name: inputData.name,
			status: inputData.status,
			priority: inputData.priority,
			category: categoryValue,
			notes: inputData.notes,
			startDate: inputData.startDate
				? new Date(inputData.startDate)
				: undefined,
			dueDate: inputData.dueDate ? new Date(inputData.dueDate) : undefined,
		};

		// Zod Validation (Using the DB schema directly for raw backend inserts)
		const validationResult = insertTaskDbSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const validatedData = validationResult.data;

		// Register the category in the shared Categories table so it becomes a
		// reusable, styled option. Scoped to the project's workspace, not the
		// editor's, so a member styling a task in a shared project does not file
		// the category away in their own workspace where the owner never sees it.
		await upsertProjectCategoryDAL(projectId, categoryValue, "task");

		// DAL Call
		const newTask = await createTaskInDB(validatedData);

		// History entry. Awaited so the row exists before the response returns,
		// but recordActivity never throws - a failed log must not fail the create.
		const user = await getCurrentUser();
		if (user) {
			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "TASK_CREATED",
				details: `Created task "${newTask.name}"`,
				projectId,
				taskId: newTask.id,
			});
		}

		// Cache Revalidation
		revalidatePath(`/projects/${projectId}`);

		// Return DTO Payload
		return { success: true, data: newTask };
	} catch (error) {
		console.error("createTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateTaskAction(
	taskId: string,
	projectId: string,
	inputData: z.infer<typeof updateTaskSchema>,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = updateTaskSchema.safeParse(inputData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid task data" };
		}

		if (validationResult.data.category?.trim()) {
			await upsertProjectCategoryDAL(
				projectId,
				validationResult.data.category.trim(),
				"task",
			);
		}

		const updatePayload: Partial<NewDbTask> = {
			name: validationResult.data.name,
			status: validationResult.data.status,
			priority: validationResult.data.priority,
			category: validationResult.data.category,
			notes: validationResult.data.notes,
			boardId: validationResult.data.boardId,
			previousBoardId: validationResult.data.previousBoardId,
			// Authoritative completion flag - previously validated then dropped,
			// which left completion state unsaved on single-task toggles.
			isCompleted: validationResult.data.isCompleted,
			statusOverriddenAt: validationResult.data.statusOverriddenAt
				? new Date(validationResult.data.statusOverriddenAt)
				: undefined,
			startDate: validationResult.data.startDate
				? new Date(validationResult.data.startDate)
				: undefined,
			dueDate: validationResult.data.dueDate
				? new Date(validationResult.data.dueDate)
				: undefined,
		};

		const { task: updatedTask, changeSummary } = await updateTaskInDB(
			taskId,
			projectId,
			updatePayload,
		);

		const user = await getCurrentUser();
		if (user) {
			// Resolved once and shared by both possible entries below.
			const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);

			// A save that changed nothing tracked produces no row at all, which is
			// why changeSummary is allowed to be null rather than an empty string.
			if (changeSummary) {
				await recordActivity({
					workspaceId,
					actorId: user.id,
					actionType: "TASK_UPDATED",
					details: changeSummary,
					projectId,
					taskId,
				});
			}

			// Completion is its own event rather than another "changed status"
			// line, because Phase 4 counts completions and a free-text sentence is
			// not something you can aggregate.
			if (validationResult.data.isCompleted === true) {
				// The people who were working on it are the ones this concerns.
				// recordActivity drops the actor, so completing your own solo task
				// notifies nobody.
				const assigneesByTask = await getTaskAssigneesByTaskIds([taskId]);
				const assignees = assigneesByTask.get(taskId) ?? [];

				const recorded = await recordActivity({
					workspaceId,
					actorId: user.id,
					actionType: "TASK_COMPLETED",
					details: `Marked "${updatedTask.name}" complete`,
					projectId,
					taskId,
					notify: assignees.map((assignee) => ({
						recipientId: assignee.userId,
						message: `A task assigned to you was completed`,
					})),
				});

				const mayEmail = recorded.filter((entry) => entry.shouldSendEmail);

				if (mayEmail.length > 0) {
					after(() =>
						sendTaskCompletedEmails({
							recipientIds: mayEmail.map((entry) => entry.recipientId),
							taskName: updatedTask.name,
							projectId,
							taskId,
							completedBy: user.firstName
								? `${user.firstName} ${user.lastName || ""}`.trim()
								: user.email,
						}),
					);
				}
			}
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: updatedTask };
	} catch (error) {
		console.error("updateTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteTaskAction(
	taskId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"delete_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await deleteTaskInDB(taskId, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkDeleteTasksAction(
	taskIds: string[],
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"delete_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await bulkDeleteTasksInDB(taskIds, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("bulkDeleteTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function bulkCompleteTasksAction(
	taskIds: string[],
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = bulkUpdateTaskStatusSchema.safeParse({
			taskIds,
			status: "Completed",
		});
		if (!validationResult.success) {
			return { success: false, error: "Invalid bulk complete data" };
		}

		await bulkCompleteTasksInDB(taskIds, projectId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("bulkCompleteTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function moveTaskAction(
	taskId: string,
	newBoardId: string,
	projectId: string,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		const validationResult = moveTaskSchema.safeParse({ taskId, newBoardId });
		if (!validationResult.success) {
			return { success: false, error: "Invalid move data" };
		}

		const movedTask = await moveTaskBoardDAL(taskId, projectId, newBoardId);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: movedTask };
	} catch (error) {
		console.error("moveTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function reorderTasksAction(
	projectId: string,
	boardId: string,
	taskIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		await reorderTasksInDB(projectId, boardId, taskIds);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("reorderTasksAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/**
 * Emails the assignees a completed task concerns.
 *
 * Separated from the action because it runs in `after()` - the response has
 * already gone, so this reads what it needs itself rather than holding a
 * closure over the request. Never throws: the task is already complete, and a
 * mail failure must not surface as a failed save.
 *
 * The preference was already decided by recordActivity; the ids arriving here
 * are only the people who may be emailed.
 */
async function sendTaskCompletedEmails(params: {
	recipientIds: string[];
	taskName: string;
	projectId: string;
	taskId: string;
	completedBy: string;
}): Promise<void> {
	try {
		const [recipients, [project]] = await Promise.all([
			db
				.select({ email: users.email })
				.from(users)
				.where(inArray(users.id, params.recipientIds)),
			db
				.select({ name: projects.name })
				.from(projects)
				.where(eq(projects.id, params.projectId)),
		]);

		const taskUrl = `${getAppBaseUrl()}/projects/${params.projectId}?task=${params.taskId}`;

		for (const recipient of recipients) {
			await sendNotification({
				to: recipient.email,
				subject: `${params.completedBy} completed ${params.taskName}`,
				// Already decided upstream - these ids are the ones that passed.
				shouldSend: true,
				template: TaskCompletedEmail({
					completedBy: params.completedBy,
					taskName: params.taskName,
					projectName: project?.name ?? "a project",
					taskUrl,
				}),
			});
		}
	} catch (error) {
		console.error("Failed to send task completion emails:", error);
	}
}
