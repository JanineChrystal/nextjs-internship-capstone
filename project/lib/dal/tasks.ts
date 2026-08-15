import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { boards, projects, tasks } from "@/lib/db/schema";
import { type TaskOutputDTO, toTaskDTO } from "@/lib/dtos/task-dto";
import type { NewDbTask } from "@/lib/types/task";

export async function createTaskInDB(data: NewDbTask): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const [project] = await db
		.select()
		.from(projects)
		.where(
			and(
				eq(projects.id, data.projectId),
				eq(projects.ownerId, user.id),
				isNull(projects.deletedAt),
			),
		);

	if (!project) {
		throw new Error(
			"Unauthorized: Cannot create task for a project you do not own",
		);
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
			.values({ ...data, position: maxPosition + 1 })
			.returning();

		return toTaskDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to create task in database", { cause: error });
	}
}

export async function getTasksByBoardId(
	boardId: string,
): Promise<TaskOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({
				task: tasks,
			})
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.where(
				and(
					eq(tasks.boardId, boardId),
					eq(projects.ownerId, user.id),
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

export async function moveTaskBoardDAL(
	taskId: string,
	projectId: string,
	newBoardId: string,
): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		// Get the new board to find its name to sync the status
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

export interface TaskWithBoardOutputDTO extends TaskOutputDTO {
	boardTitle: string;
}

// Cross-project task fetch for surfaces like the global calendar page, which
// need every task the user owns rather than one project's tasks. Includes
// the board title directly since callers span many projects at once.
export async function getAllUserTasksDAL(): Promise<TaskWithBoardOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({ task: tasks, boardName: boards.name })
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.innerJoin(boards, eq(tasks.boardId, boards.id))
			.where(
				and(
					eq(projects.ownerId, user.id),
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
					eq(projects.ownerId, user.id),
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

export async function updateTaskInDB(
	taskId: string,
	projectId: string,
	data: Partial<NewDbTask>,
): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(tasks)
			.set({ ...data, updatedAt: new Date() })
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Task not found");

		return toTaskDTO(result[0]);
	} catch (error) {
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
		// Need to get the "Completed" board
		const [completedBoard] = await db
			.select()
			.from(boards)
			.where(eq(boards.name, "Completed"));

		// If there is a completed board, we set boardId to it, otherwise just status.
		// Usually the status is literally "Completed"

		const updateData: Partial<NewDbTask> = {
			status: "Completed",
			updatedAt: new Date(),
		};

		if (completedBoard) {
			updateData.boardId = completedBoard.id;
		}

		await db
			.update(tasks)
			.set(updateData)
			.where(
				and(
					inArray(tasks.id, taskIds),
					eq(tasks.projectId, projectId),
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
		// Drizzle doesn't support bulk update with different values easily in a single query for Postgres without raw SQL case statements,
		// so we update them in a transaction.
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
							isNull(tasks.deletedAt),
						),
					);
			}
		});
	} catch (error) {
		throw new Error("Failed to reorder tasks", { cause: error });
	}
}
