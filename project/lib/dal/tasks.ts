import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import { boards, projects, tasks } from "@/lib/db/schema";
import {
	type TaskOutputDTO,
	type TaskWithBoardOutputDTO,
	toTaskDTO,
} from "@/lib/dtos/task-dto";
import type { DbTask, NewDbTask } from "@/lib/types/task";
import { describeTaskChanges } from "@/lib/utils/activity";

export async function createTaskInDB(data: NewDbTask): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/**
	 * central access resolution - authorizes task creation via comprehensive
	 * project roles rather than an ownership filter that would incorrectly
	 * reject permitted members.
	 */
	const role = await getEffectiveProjectRoleDAL(data.projectId);
	if (!role) {
		throw new Error("Unauthorized: No access to this project");
	}

	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, data.projectId), isNull(projects.deletedAt)));

	if (!project) {
		throw new Error("Project not found");
	}

	try {
		const existingBoardTasks = await db
			.select({ position: tasks.position })
			.from(tasks)
			.where(and(eq(tasks.boardId, data.boardId), isNull(tasks.deletedAt)));
		const maxPosition =
			existingBoardTasks.length > 0
				? Math.max(...existingBoardTasks.map((t) => t.position))
				: -1;

		const result = await db
			.insert(tasks)
			.values({
				...data,
				notes: data.notes,
				position: maxPosition + 1,
			})
			.returning();

		return toTaskDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to create task in database", { cause: error });
	}
}

export async function moveTaskBoardDAL(
	taskId: string,
	projectId: string,
	newBoardId: string,
): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		/** sync status - retrieves the target board to keep the task's status field in sync with its new column. */
		const [board] = await db
			.select()
			.from(boards)
			.where(eq(boards.id, newBoardId));
		if (!board) throw new Error("Board not found");

		const result = await db
			.update(tasks)
			.set({ boardId: newBoardId, status: board.name, updatedAt: new Date() })
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Task not found");

		return toTaskDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to move task to new board", { cause: error });
	}
}

/**
 * get all user tasks - fetches every task the user can reach across all
 * accessible projects, including board titles to support global views like
 * the cross-project calendar.
 */
export async function getAllUserTasksDAL(): Promise<TaskWithBoardOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/**
	 * inclusive project scope - scopes the task fetch to all accessible
	 * projects resolved centrally, avoiding an owner-only filter that would
	 * hide shared tasks.
	 */
	const accessibleProjects = await getAllUserProjectsDAL();
	const projectIds = accessibleProjects.map((project) => project.id);

	if (projectIds.length === 0) return [];

	try {
		const results = await db
			.select({ task: tasks, boardName: boards.name })
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.innerJoin(boards, eq(tasks.boardId, boards.id))
			.where(
				and(
					inArray(tasks.projectId, projectIds),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
					isNull(projects.deletedAt),
				),
			)
			.orderBy(tasks.position);

		return results.map((row) => ({
			...toTaskDTO(row.task),
			boardTitle: row.boardName,
		}));
	} catch (error) {
		throw new Error("Failed to fetch all tasks from database", {
			cause: error,
		});
	}
}

export async function getTasksByProjectId(
	projectId: string,
): Promise<TaskOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/**
	 * strict denial - throws on permission failure rather than returning an
	 * empty list, acting as a hard security boundary for callers that lack
	 * their own checks.
	 */
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({
				task: tasks,
			})
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.where(
				and(
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
					isNull(projects.deletedAt),
				),
			)
			.orderBy(tasks.position);

		return results.map((row) => toTaskDTO(row.task));
	} catch (error) {
		throw new Error("Failed to fetch tasks from database", { cause: error });
	}
}

/**
 * update task - updates a task and generates a concise change summary for
 * activity logging by reading the before-state, returning a null summary if
 * no tracked fields were actually altered.
 */
export async function updateTaskInDB(
	taskId: string,
	projectId: string,
	data: Partial<NewDbTask>,
): Promise<{ task: TaskOutputDTO; changeSummary: string | null }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [before] = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			);

		if (!before) throw new Error("Task not found");

		const updateData = {
			...data,
			...(data.notes !== undefined && { notes: data.notes }),
			updatedAt: new Date(),
		};

		const result = await db
			.update(tasks)
			.set(updateData)
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Task not found");

		const after = result[0] as DbTask;

		return {
			task: toTaskDTO(after),
			changeSummary: describeTaskChanges(before as DbTask, after),
		};
	} catch (error) {
		if (error instanceof Error && error.message === "Task not found")
			throw error;
		throw new Error("Failed to update task in database", { cause: error });
	}
}

export async function deleteTaskInDB(
	taskId: string,
	projectId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(tasks)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to delete task in database", { cause: error });
	}
}

export async function bulkDeleteTasksInDB(
	taskIds: string[],
	projectId: string,
): Promise<void> {
	if (taskIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(tasks)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					inArray(tasks.id, taskIds),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to bulk delete tasks in database", {
			cause: error,
		});
	}
}

export async function bulkCompleteTasksInDB(
	taskIds: string[],
	projectId: string,
): Promise<void> {
	if (taskIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		/**
		 * find project completion board - locates the completion column
		 * specifically for this project using its boolean flag, rather than
		 * relying on a cross-project name search.
		 */
		const [completionBoard] = await db
			.select({ id: boards.id, name: boards.name })
			.from(boards)
			.where(
				and(
					eq(boards.projectId, projectId),
					eq(boards.isCompletionBoard, true),
					isNull(boards.deletedAt),
				),
			);

		/**
		 * authoritative completion - sets the isCompleted flag authoritatively,
		 * treating the move to a completion board as a best-effort convenience
		 * if one is designated.
		 */
		const updateData: Partial<NewDbTask> = {
			isCompleted: true,
			updatedAt: new Date(),
		};

		updateData.status = "Completed";

		if (completionBoard) {
			updateData.boardId = completionBoard.id;
		}

		await db
			.update(tasks)
			.set(updateData)
			.where(
				and(
					inArray(tasks.id, taskIds),
					eq(tasks.projectId, projectId),
					isNull(tasks.archivedAt),
					isNull(tasks.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to bulk complete tasks in database", {
			cause: error,
		});
	}
}

export async function reorderTasksInDB(
	projectId: string,
	boardId: string,
	taskIds: string[],
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db.transaction(async (tx) => {
			for (let i = 0; i < taskIds.length; i++) {
				await tx
					.update(tasks)
					.set({ position: i, updatedAt: new Date() })
					.where(
						and(
							eq(tasks.id, taskIds[i]),
							eq(tasks.boardId, boardId),
							eq(tasks.projectId, projectId),
							isNull(tasks.archivedAt),
							isNull(tasks.deletedAt),
						),
					);
			}
		});
	} catch (error) {
		throw new Error("Failed to reorder tasks", { cause: error });
	}
}
