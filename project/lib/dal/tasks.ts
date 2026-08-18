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
import type { NewDbTask } from "@/lib/types/task";

export async function createTaskInDB(data: NewDbTask): Promise<TaskOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	// Access is resolved centrally rather than by ownership: a direct member or
	// a team member holds create_task, and the ownerId filter that used to sit
	// here rejected them outright even though createTaskAction had already
	// passed them through the permission check.
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
			.values({ ...data, position: maxPosition + 1 })
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

// Cross-project task fetch for surfaces like the global calendar page, which
// need every task the user can reach rather than one project's tasks. Includes
// the board title directly since callers span many projects at once.
export async function getAllUserTasksDAL(): Promise<TaskWithBoardOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	// Scoped to the same three access routes as the project list rather than
	// ownership alone. Filtering on projects.ownerId here left the global
	// calendar showing a shared project with none of its tasks, because
	// getAllUserProjectsDAL already resolves all three routes.
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

	// This is the real security boundary for at least one caller (getTasksAction
	// performs no permission check of its own), so denial must throw rather than
	// return an empty list - silently returning [] would disguise the refusal as
	// "this project has no tasks".
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
		// The completion column is identified by its flag, not its name, and is
		// scoped to this project - the previous name lookup searched every
		// project's boards and could move tasks into an unrelated project.
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

		// isCompleted is authoritative and always set. Moving the task into a
		// completion column is a best-effort convenience: if no column is
		// designated, the task simply stays where it is.
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
