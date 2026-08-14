import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
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
		const result = await db.insert(tasks).values(data).returning();

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
			);

		return results.map((row) => toTaskDTO(row.task));
	} catch (error) {
		throw new Error("Failed to fetch tasks from database", { cause: error });
	}
}

export async function moveTaskBoardDAL(
	taskId: string,
	newBoardId: string,
): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		// Get the new board to find its name to sync the status
		const { boards } = await import("@/lib/db/schema");
		const [board] = await db
			.select()
			.from(boards)
			.where(eq(boards.id, newBoardId));
		if (!board) throw new Error("Board not found");

		const result = await db
			.update(tasks)
			.set({ boardId: newBoardId, status: board.name, updatedAt: new Date() })
			.where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
			.returning();

		return toTaskDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to move task to new board", { cause: error });
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
			);

		return results.map((row) => toTaskDTO(row.task));
	} catch (error) {
		throw new Error("Failed to fetch tasks from database", { cause: error });
	}
}

export async function updateTaskInDB(
	taskId: string,
	data: Partial<NewDbTask>,
): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(tasks)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
			.returning();

		if (result.length === 0) throw new Error("Task not found");

		return toTaskDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to update task in database", { cause: error });
	}
}

export async function deleteTaskInDB(taskId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(tasks)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)));
	} catch (error) {
		throw new Error("Failed to delete task in database", { cause: error });
	}
}

export async function bulkDeleteTasksInDB(taskIds: string[]): Promise<void> {
	if (taskIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(tasks)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(inArray(tasks.id, taskIds), isNull(tasks.deletedAt)));
	} catch (error) {
		throw new Error("Failed to bulk delete tasks in database", {
			cause: error,
		});
	}
}

export async function bulkCompleteTasksInDB(taskIds: string[]): Promise<void> {
	if (taskIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		// Need to get the "Completed" board
		const { boards } = await import("@/lib/db/schema");
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
			.where(and(inArray(tasks.id, taskIds), isNull(tasks.deletedAt)));
	} catch (error) {
		throw new Error("Failed to bulk complete tasks in database", {
			cause: error,
		});
	}
}
