import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { db } from "@/lib/db";
import { boards, projects, tasks } from "@/lib/db/schema";

export async function getProjectBoardsDAL(projectId: string) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	// Access resolved centrally, so direct and team members see the board columns
	// too. Throws rather than returning [] so a refusal is never mistaken for an
	// empty board.
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({ board: boards })
			.from(boards)
			.innerJoin(projects, eq(boards.projectId, projects.id))
			.where(
				and(
					eq(boards.projectId, projectId),
					isNull(boards.deletedAt),
					isNull(projects.deletedAt),
				),
			)
			.orderBy(boards.position);
		return results.map((row) => row.board);
	} catch (error) {
		throw new Error("Failed to fetch boards", { cause: error });
	}
}

export async function createBoardDAL(projectId: string, name: string) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select({ workspaceId: projects.workspaceId })
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));
		if (!project) throw new Error("Project not found");

		// Get highest position
		const existingBoards = await getProjectBoardsDAL(projectId);
		const maxPosition =
			existingBoards.length > 0
				? Math.max(...existingBoards.map((b) => b.position))
				: -1;

		const result = await db
			.insert(boards)
			.values({
				projectId,
				workspaceId: project.workspaceId,
				name,
				position: maxPosition + 1,
			})
			.returning();
		return result[0];
	} catch (error) {
		throw new Error("Failed to create board", { cause: error });
	}
}

export async function renameBoardDAL(
	boardId: string,
	projectId: string,
	newName: string,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(boards)
			.set({ name: newName, updatedAt: new Date() })
			.where(
				and(
					eq(boards.id, boardId),
					eq(boards.projectId, projectId),
					isNull(boards.deletedAt),
				),
			)
			.returning();
		return result[0];
	} catch (error) {
		throw new Error("Failed to rename board", { cause: error });
	}
}

export async function deleteBoardDAL(boardId: string, projectId: string) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db.transaction(async (tx) => {
			// Soft-delete the board's tasks first ("moved to trash").
			await tx
				.update(tasks)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(
					and(
						eq(tasks.boardId, boardId),
						eq(tasks.projectId, projectId),
						isNull(tasks.deletedAt),
					),
				);

			await tx
				.update(boards)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(
					and(
						eq(boards.id, boardId),
						eq(boards.projectId, projectId),
						isNull(boards.deletedAt),
					),
				);
		});
	} catch (error) {
		throw new Error("Failed to delete board", { cause: error });
	}
}

/**
 * Designates a board as the project's completion column.
 *
 * Exactly one board per project may hold the flag, so any previous holder is
 * cleared in the same transaction.
 */
export async function setCompletionBoardDAL(
	boardId: string,
	projectId: string,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(boards)
				.set({ isCompletionBoard: false, updatedAt: new Date() })
				.where(
					and(
						eq(boards.projectId, projectId),
						eq(boards.isCompletionBoard, true),
					),
				);

			const result = await tx
				.update(boards)
				.set({ isCompletionBoard: true, updatedAt: new Date() })
				.where(
					and(
						eq(boards.id, boardId),
						eq(boards.projectId, projectId),
						isNull(boards.deletedAt),
					),
				)
				.returning();

			if (result.length === 0) throw new Error("Board not found");
		});
	} catch (error) {
		throw new Error("Failed to set completion board", { cause: error });
	}
}

export async function countTasksInBoardDAL(
	boardId: string,
	projectId: string,
): Promise<number> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({ id: tasks.id })
			.from(tasks)
			.where(
				and(
					eq(tasks.boardId, boardId),
					eq(tasks.projectId, projectId),
					isNull(tasks.deletedAt),
				),
			);
		return results.length;
	} catch (error) {
		throw new Error("Failed to count tasks in board", { cause: error });
	}
}

export async function reorderBoardsDAL(projectId: string, boardIds: string[]) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		// Drizzle doesn't support bulk update with different values easily in a single query for Postgres without raw SQL case statements,
		// so we update them in a transaction.
		await db.transaction(async (tx) => {
			for (let i = 0; i < boardIds.length; i++) {
				await tx
					.update(boards)
					.set({ position: i, updatedAt: new Date() })
					.where(
						and(eq(boards.id, boardIds[i]), eq(boards.projectId, projectId)),
					);
			}
		});
		return true;
	} catch (error) {
		throw new Error("Failed to reorder boards", { cause: error });
	}
}
