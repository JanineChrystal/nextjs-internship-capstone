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
		/**
		 * verify task creation permission - checks if the user has
		 * authorization to create a task in the project.
		 */
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"create_task",
		);
		if (!hasPermission) {
			return { success: false, error: await getSessionFailureReason() };
		}

		/**
		 * default category fallback - uses Uncategorized if no category is
		 * provided to avoid empty strings.
		 */
		const categoryValue = inputData.category?.trim() || "Uncategorized";

		/**
		 * parse payload - prepares the incoming task data for database
		 * insertion.
		 */
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

		/**
		 * zod validation - validates the raw payload directly against the
		 * database schema.
		 */
		const validationResult = insertTaskDbSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const validatedData = validationResult.data;

		/**
		 * register task category - upserts the category into the project
		 * workspace to ensure it is visible to the project owner and
		 * reusable.
		 */
		await upsertProjectCategoryDAL(projectId, categoryValue, "task");

		/** database insertion - inserts the validated task via the DAL. */
		const newTask = await createTaskInDB(validatedData);

		/**
		 * safe history logging - awaits the activity creation to ensure the
		 * row exists, relying on the logger's error suppression to protect
		 * task creation.
		 */
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

		/**
		 * cache revalidation - triggers a cache revalidation for the
		 * updated project path.
		 */
		revalidatePath(`/projects/${projectId}`);

		/** return dto payload - returns the newly created task data. */
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
			/**
			 * authoritative completion flag - persists the explicit isCompleted
			 * state to fix missing saves during single-task toggles.
			 */
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
			/**
			 * shared workspace resolution - resolves workspace ID once for use
			 * across multiple subsequent activity entries.
			 */
			const workspaceId = await resolveProjectWorkspaceIdDAL(projectId);

			/**
			 * conditional activity logging - skips activity logging if
			 * changeSummary is null, indicating no tracked changes occurred.
			 */
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

			/**
			 * explicit completion tracking - logs task completion as a discrete
			 * event to support accurate aggregations in Phase 4.
			 */
			if (validationResult.data.isCompleted === true) {
				/**
				 * focused completion notification - alerts task assignees of the
				 * completion, naturally excluding solo workers via recordActivity
				 * filtering.
				 */
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
 * send task completed emails - asynchronously sends completion
 * emails to assignees via after(), independently querying necessary
 * data and suppressing errors to protect the initial save
 * operation.
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
				/** should send - already decided upstream - these ids are the ones that passed. */
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
