import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { comments, tasks, users } from "@/lib/db/schema";
import { type CommentOutputDTO, toCommentDTO } from "@/lib/dtos/comment-dto";
import type { CommentsPageResult } from "@/lib/types/comment";

// Paginates by top-level (root) comment thread, always including every reply
// to whatever root comments are on the page - keeps replies from ever being
// orphaned from their parent across a page boundary.
export async function getCommentsByTaskId(
	taskId: string,
	projectId: string,
	limit = 20,
	offset = 0,
): Promise<CommentsPageResult> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const rootRows = await db
			.select({ comment: comments, author: users })
			.from(comments)
			.innerJoin(tasks, eq(comments.taskId, tasks.id))
			.innerJoin(users, eq(comments.authorId, users.id))
			.where(
				and(
					eq(comments.taskId, taskId),
					eq(tasks.projectId, projectId),
					isNull(comments.parentId),
					isNull(tasks.deletedAt),
				),
			)
			.orderBy(desc(comments.createdAt))
			.limit(limit + 1)
			.offset(offset);

		const hasMore = rootRows.length > limit;
		const pageRootRows = rootRows.slice(0, limit);
		const rootIds = pageRootRows.map((row) => row.comment.id);

		const replyRows =
			rootIds.length > 0
				? await db
						.select({ comment: comments, author: users })
						.from(comments)
						.innerJoin(users, eq(comments.authorId, users.id))
						.where(inArray(comments.parentId, rootIds))
				: [];

		const allRows = [...pageRootRows, ...replyRows].sort(
			(a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime(),
		);

		return {
			comments: allRows.map((row) => toCommentDTO(row.comment, row.author)),
			hasMore,
		};
	} catch (error) {
		throw new Error("Failed to fetch comments from database", {
			cause: error,
		});
	}
}

// Used to enforce a 2-level (root + direct reply) thread limit before insert -
// a reply's parent must itself be a root comment (parentId === null).
export async function getCommentParentId(
	commentId: string,
): Promise<string | null> {
	const [row] = await db
		.select({ parentId: comments.parentId })
		.from(comments)
		.where(eq(comments.id, commentId));
	return row?.parentId ?? null;
}

export async function createCommentInDB(
	taskId: string,
	projectId: string,
	authorId: string,
	body: string,
	parentId?: string,
): Promise<CommentOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [task] = await db
			.select({ id: tasks.id })
			.from(tasks)
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.deletedAt),
				),
			);
		if (!task) throw new Error("Task not found");

		const [author] = await db
			.select()
			.from(users)
			.where(eq(users.id, authorId));
		if (!author) throw new Error("Author not found");

		const [comment] = await db
			.insert(comments)
			.values({ taskId, authorId, body, parentId })
			.returning();

		return toCommentDTO(comment, author);
	} catch (error) {
		throw new Error("Failed to create comment in database", { cause: error });
	}
}

export async function updateCommentInDB(
	commentId: string,
	authorId: string,
	body: string,
): Promise<CommentOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(comments)
			.set({ body, updatedAt: new Date() })
			.where(
				and(
					eq(comments.id, commentId),
					eq(comments.authorId, authorId),
					isNull(comments.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Comment not found");

		const [author] = await db
			.select()
			.from(users)
			.where(eq(users.id, result[0].authorId));

		return toCommentDTO(result[0], author);
	} catch (error) {
		throw new Error("Failed to update comment in database", { cause: error });
	}
}

export async function deleteCommentInDB(
	commentId: string,
	requesterId: string,
	canModerate: boolean,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const ownerFilter = canModerate
			? isNull(comments.deletedAt)
			: and(eq(comments.authorId, requesterId), isNull(comments.deletedAt));

		await db
			.update(comments)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(eq(comments.id, commentId), ownerFilter));
	} catch (error) {
		throw new Error("Failed to delete comment in database", { cause: error });
	}
}
