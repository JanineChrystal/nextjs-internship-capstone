import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { boards, projects } from "@/lib/db/schema";

export async function getProjectBoardsDAL(projectId: string) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select({ board: boards })
			.from(boards)
			.innerJoin(projects, eq(boards.projectId, projects.id))
			.where(
				and(
					eq(boards.projectId, projectId),
					eq(projects.ownerId, user.id),
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

export async function createBoardDAL(
	projectId: string,
	workspaceId: string,
	name: string,
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
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
				workspaceId,
				name,
				position: maxPosition + 1,
			})
			.returning();
		return result[0];
	} catch (error) {
		throw new Error("Failed to create board", { cause: error });
	}
}

export async function renameBoardDAL(boardId: string, newName: string) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(boards)
			.set({ name: newName, updatedAt: new Date() })
			.where(and(eq(boards.id, boardId), isNull(boards.deletedAt)))
			.returning();
		return result[0];
	} catch (error) {
		throw new Error("Failed to rename board", { cause: error });
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
