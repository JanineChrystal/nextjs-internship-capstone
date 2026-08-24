import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import { db } from "@/lib/db";
import { comments, tasks, users } from "@/lib/db/schema";
import {
	type FlaggedCommentDTO,
	toFlaggedCommentDTO,
} from "@/lib/dtos/comment-moderation-dto";
import type { PendingProfanityComment } from "@/lib/types/comment";
import { decrypt } from "@/lib/utils/encryption";

/**
 * get flagged comments - retrieves all comments awaiting moderation
 * review for a project, strictly gated by the manage_members permission
 * to preserve queue privacy.
 */
export async function getFlaggedCommentsDAL(
	projectId: string,
): Promise<FlaggedCommentDTO[]> {
	const allowed = await verifyProjectPermissionDAL(projectId, "manage_members");
	if (!allowed) throw new Error("Unauthorized");

	const rows = await db
		.select({
			commentId: comments.id,
			taskId: comments.taskId,
			taskTitle: tasks.name,
			authorId: comments.authorId,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
			imageUrl: users.imageUrl,
			body: comments.body,
			flagReason: comments.flagReason,
			createdAt: comments.createdAt,
		})
		.from(comments)
		.innerJoin(tasks, eq(comments.taskId, tasks.id))
		.innerJoin(users, eq(comments.authorId, users.id))
		.where(
			and(
				eq(tasks.projectId, projectId),
				eq(comments.isFlagged, true),
				/** filter reviewed - excludes already-moderated comments from the queue using the moderatedAt stamp. */
				isNull(comments.moderatedAt),
				isNull(comments.deletedAt),
				isNull(tasks.deletedAt),
			),
		)
		.orderBy(desc(comments.createdAt));

	return rows.map(toFlaggedCommentDTO);
}

/**
 * resolve flagged comment - executes a moderation decision (dismiss or
 * delete), ensuring an audit trail is maintained by recording the
 * moderator's identity and timestamp.
 */
export async function resolveFlaggedCommentDAL(
	commentId: string,
	projectId: string,
	decision: "dismiss" | "delete",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const allowed = await verifyProjectPermissionDAL(projectId, "manage_members");
	if (!allowed) throw new Error("Unauthorized");

	/**
	 * secure project resolution - verifies the comment's parent project
	 * directly from the DB to prevent cross-project moderation spoofing.
	 */
	const [row] = await db
		.select({ projectId: tasks.projectId })
		.from(comments)
		.innerJoin(tasks, eq(comments.taskId, tasks.id))
		.where(eq(comments.id, commentId));

	if (!row) throw new Error("Comment not found");
	if (row.projectId !== projectId) throw new Error("Unauthorized");

	const now = new Date();

	try {
		await db
			.update(comments)
			.set({
				moderatedById: user.id,
				moderatedAt: now,
				updatedAt: now,
				/**
				 * clear profanity check - explicitly clears the pending check flag
				 * upon human review to prevent automated retries from silently
				 * re-flagging a dismissed comment.
				 */
				pendingProfanityCheck: false,
				/** clear flag on dismiss - ensures dismissed comments read as ordinary by unsetting the flag state. */
				...(decision === "dismiss"
					? { isFlagged: false, flagReason: null }
					: { deletedAt: now }),
			})
			.where(eq(comments.id, commentId));
	} catch (error) {
		throw new Error("Failed to resolve flagged comment", { cause: error });
	}
}

/** apply moderation verdict - records the initial moderation result on a newly created comment. */
export async function applyModerationVerdictDAL(
	commentId: string,
	isFlagged: boolean,
	reason: string | null,
	isRetry: boolean = false,
): Promise<void> {
	if (!isFlagged && !isRetry) return;

	await db
		.update(comments)
		.set({
			isFlagged,
			flagReason: reason,
			...(isRetry ? { pendingProfanityCheck: false } : {}),
			updatedAt: new Date(),
		})
		.where(eq(comments.id, commentId));
}

export async function markCommentForProfanityRetryDAL(
	commentId: string,
): Promise<void> {
	await db
		.update(comments)
		.set({ pendingProfanityCheck: true, updatedAt: new Date() })
		.where(eq(comments.id, commentId));
}

export async function countCommentsPendingProfanityCheckDAL(
	projectId: string,
): Promise<number> {
	const allowed = await verifyProjectPermissionDAL(projectId, "manage_members");
	if (!allowed) throw new Error("Unauthorized");

	const [row] = await db
		.select({ total: count() })
		.from(comments)
		.innerJoin(tasks, eq(comments.taskId, tasks.id))
		.where(pendingProfanityCheckWhere(projectId));

	return row?.total ?? 0;
}

/**
 * get comments pending profanity check - retrieves a batch of comments
 * awaiting asynchronous moderation verdicts, including author details
 * so delayed results can be delivered via notification.
 */
export async function getCommentsPendingProfanityCheckDAL(
	projectId: string,
	limit: number,
): Promise<PendingProfanityComment[]> {
	const allowed = await verifyProjectPermissionDAL(projectId, "manage_members");
	if (!allowed) throw new Error("Unauthorized");

	const rows = await db
		.select({
			id: comments.id,
			body: comments.body,
			authorId: comments.authorId,
			authorEmail: users.email,
			taskId: comments.taskId,
			taskName: tasks.name,
		})
		.from(comments)
		.innerJoin(users, eq(comments.authorId, users.id))
		.innerJoin(tasks, eq(comments.taskId, tasks.id))
		.where(pendingProfanityCheckWhere(projectId))
		.limit(limit);

	/**
	 * inline decryption - decrypts comment bodies immediately so the async
	 * profanity checker evaluates actual content rather than clean ciphertext.
	 */
	return rows.map((row) => ({ ...row, body: decrypt(row.body) ?? row.body }));
}

/**
 * pending profanity check where - centralizes the query condition for
 * pending checks, ensuring consistency between counts and batches while
 * critically excluding already-moderated comments.
 */
function pendingProfanityCheckWhere(projectId: string) {
	return and(
		eq(tasks.projectId, projectId),
		eq(comments.pendingProfanityCheck, true),
		isNull(comments.moderatedAt),
		isNull(comments.deletedAt),
	);
}
