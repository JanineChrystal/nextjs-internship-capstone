import { FLAGGED_SNIPPET_LENGTH } from "@/lib/constants/profanity";
import { decrypt } from "@/lib/utils/encryption";

/** One flagged comment, as the moderation table renders it. */
export interface FlaggedCommentDTO {
	commentId: string;
	taskId: string;
	taskTitle: string;
	authorId: string;
	authorName: string;
	authorAvatar: string;
	commentSnippet: string;
	flagReason: string;
	flaggedAt: Date;
}

function toAuthorName(author: {
	firstName: string | null;
	lastName: string | null;
	email: string;
}): string {
	return (
		[author.firstName, author.lastName].filter(Boolean).join(" ") ||
		author.email
	);
}

/**
 * The body is truncated here rather than in the component: the moderation table
 * only ever shows a preview, so sending a 2,000-character comment to draw two
 * lines is wasted payload.
 */
export function toFlaggedCommentDTO(row: {
	commentId: string;
	taskId: string;
	taskTitle: string;
	authorId: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
	imageUrl: string | null;
	body: string;
	flagReason: string | null;
	createdAt: Date;
}): FlaggedCommentDTO {
	// Decrypted before truncating, not after. Comment bodies are stored
	// encrypted, and slicing ciphertext would hand the moderator 160 characters
	// of hex to judge - which is exactly what this table used to show.
	const plain = decrypt(row.body) ?? row.body;

	const snippet =
		plain.length > FLAGGED_SNIPPET_LENGTH
			? `${plain.slice(0, FLAGGED_SNIPPET_LENGTH)}...`
			: plain;

	return {
		commentId: row.commentId,
		taskId: row.taskId,
		taskTitle: row.taskTitle,
		authorId: row.authorId,
		authorName: toAuthorName(row),
		authorAvatar: row.imageUrl ?? "",
		commentSnippet: snippet,
		flagReason: row.flagReason ?? "Flagged",
		flaggedAt: row.createdAt,
	};
}
