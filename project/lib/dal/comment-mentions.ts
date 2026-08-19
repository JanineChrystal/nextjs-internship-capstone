import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getProjectMembersDAL } from "@/lib/dal/project-members";
import { db } from "@/lib/db";
import { commentMentions, users } from "@/lib/db/schema";
import { extractMentionHandles, toMentionHandle } from "@/lib/utils/mentions";

export interface ResolvedMention {
	userId: string;
	name: string;
	handle: string;
}

/**
 * Turns the handles typed in a comment into real project members.
 *
 * Resolved against the project's own members, never against all users: only
 * someone who can already see the task may be mentioned on it, and anything
 * that matches nobody is dropped rather than erroring - "@here" and "@lunch"
 * are things people type without meaning a person.
 *
 * Handles are never trusted from the client. The body is re-parsed here, so a
 * caller cannot post a harmless comment while sending a list of user ids to
 * notify.
 */
export async function resolveMentionsDAL(
	body: string,
	projectId: string,
): Promise<ResolvedMention[]> {
	const handles = extractMentionHandles(body);
	if (handles.length === 0) return [];

	const members = await getProjectMembersDAL(projectId);
	const byHandle = new Map(
		members.map((member) => [toMentionHandle(member.email), member]),
	);

	return handles.flatMap((handle) => {
		const member = byHandle.get(handle);
		return member ? [{ userId: member.userId, name: member.name, handle }] : [];
	});
}

/**
 * Records who was mentioned. `onConflictDoNothing` against the unique
 * (commentId, mentionedUserId) pair, so editing a comment cannot duplicate a
 * mention row.
 */
export async function createCommentMentionsDAL(
	commentId: string,
	userIds: string[],
): Promise<void> {
	if (userIds.length === 0) return;

	await db
		.insert(commentMentions)
		.values(userIds.map((mentionedUserId) => ({ commentId, mentionedUserId })))
		.onConflictDoNothing();
}

/** Display names for the handles in a set of comments, for rendering. */
export async function getMentionedMembersDAL(
	projectId: string,
): Promise<Map<string, { userId: string; label: string }>> {
	const members = await getProjectMembersDAL(projectId);
	return new Map(
		members.map((member) => [
			toMentionHandle(member.email),
			{ userId: member.userId, label: member.name },
		]),
	);
}

/** The user ids mentioned across a set of comments, for the comment DTO. */
export async function getMentionsForCommentsDAL(
	commentIds: string[],
): Promise<Map<string, string[]>> {
	if (commentIds.length === 0) return new Map();

	const rows = await db
		.select({
			commentId: commentMentions.commentId,
			userId: commentMentions.mentionedUserId,
			email: users.email,
		})
		.from(commentMentions)
		.innerJoin(users, eq(commentMentions.mentionedUserId, users.id))
		.where(
			and(
				inArray(commentMentions.commentId, commentIds),
				isNull(commentMentions.deletedAt),
			),
		);

	const byComment = new Map<string, string[]>();
	for (const row of rows) {
		const existing = byComment.get(row.commentId);
		if (existing) existing.push(row.userId);
		else byComment.set(row.commentId, [row.userId]);
	}
	return byComment;
}
