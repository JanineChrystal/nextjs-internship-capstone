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
 * Comments awaiting review on a project.
 *
 * Gated on manage_members - the same permission that governs the rest of
 * project settings. A member seeing every flagged comment would defeat the
 * point of a review queue.
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
				// Already-reviewed comments drop out of the queue; the moderation
				// stamp is what marks them handled.
				isNull(comments.moderatedAt),
				isNull(comments.deletedAt),
				isNull(tasks.deletedAt),
			),
		)
		.orderBy(desc(comments.createdAt));

	return rows.map(toFlaggedCommentDTO);
}

/**
 * Clears a flag or deletes the comment, recording who decided.
 *
 * "dismiss" keeps the comment and marks it reviewed; "delete" soft-deletes it.
 * Both write moderatedById and moderatedAt, so there is an audit trail of who
 * cleared what - a moderation queue with no record of the moderator is not one.
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

	// The comment's own project is resolved from the database rather than
	// trusted, so naming a project you moderate cannot act on a comment in one
	// you do not.
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
				// A person has ruled on this comment, so the machine queue is done with
				// it. Leaving this true is what let a later retry silently re-flag a
				// dismissal - invisibly, since the review queue filters on moderatedAt
				// and would never show it again.
				pendingProfanityCheck: false,
				// Dismissing clears the flag as well as stamping it, so the comment
				// reads as ordinary everywhere else.
				...(decision === "dismiss"
					? { isFlagged: false, flagReason: null }
					: { deletedAt: now }),
			})
			.where(eq(comments.id, commentId));
	} catch (error) {
		throw new Error("Failed to resolve flagged comment", { cause: error });
	}
}

/** Records a moderation verdict on a freshly posted comment. */
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
 * One batch of comments still waiting on a profanity verdict.
 *
 * Returns the author and task alongside the body because the retry has to be
 * able to tell someone: a verdict that lands minutes after the fact cannot be
 * delivered by the composer dialog, so it is delivered by notification instead.
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

	// Decrypted here, not by the caller. Bodies are stored encrypted, and the
	// retry existed to run a profanity check over them - over ciphertext, which
	// never matches anything, so every recheck came back clean.
	return rows.map((row) => ({ ...row, body: decrypt(row.body) ?? row.body }));
}

/**
 * The one definition of "still waiting on a verdict", shared by the count and
 * the batch so a comment can never appear in one and not the other.
 *
 * The moderatedAt condition is the important one: without it, dismissing a
 * flagged comment left pendingProfanityCheck set, and the next retry re-flagged
 * it - invisibly, because the review queue filters on moderatedAt and would no
 * longer show it.
 */
function pendingProfanityCheckWhere(projectId: string) {
	return and(
		eq(tasks.projectId, projectId),
		eq(comments.pendingProfanityCheck, true),
		isNull(comments.moderatedAt),
		isNull(comments.deletedAt),
	);
}
