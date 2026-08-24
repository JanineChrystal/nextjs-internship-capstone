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
 * resolve mentions - converts raw comment handles into project member
 * identities, silently dropping unrecognized handles and strictly
 * re-parsing server-side to prevent client spoofing.
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
 * create comment mentions - records parsed mentions to the database,
 * using conflict resolution to prevent duplicate entries when comments
 * are edited.
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

/** get mentioned members - retrieves resolved display names for handles present in comments for UI rendering. */
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

/** get mentions for comments - aggregates all mentioned user IDs across a provided set of comment IDs. */
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
