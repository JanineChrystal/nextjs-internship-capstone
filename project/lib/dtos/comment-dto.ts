import type { DbComment } from "@/lib/types/activity";
import { decrypt } from "@/lib/utils/encryption";

export interface CommentOutputDTO {
	id: string;
	taskId: string;
	authorId: string;
	authorName: string;
	authorAvatarUrl: string;
	parentId: string | null;
	body: string;
	isDeleted: boolean;
	/** Flagged by the language filter and not yet reviewed by a moderator. */
	isUnderReview: boolean;
	/** Removed by a moderator rather than by its own author. */
	isRejected: boolean;
	createdAt: Date;
	updatedAt: Date;
}

function sanitizeText(value: string): string {
	return value.replace(/[<>]/g, "");
}

function toAuthorName(author: {
	firstName: string | null;
	lastName: string | null;
	email: string;
}): string {
	const fullName = [author.firstName, author.lastName]
		.filter(Boolean)
		.join(" ");
	return fullName || author.email;
}

export function toCommentDTO(
	comment: DbComment,
	author: {
		firstName: string | null;
		lastName: string | null;
		email: string;
		imageUrl: string | null;
	},
): CommentOutputDTO {
	const isDeleted = comment.deletedAt !== null;

	// The same predicate the moderation queue uses, so a comment is "under
	// review" in the thread for exactly as long as it is waiting in the queue.
	// Deriving it from the same two columns rather than a third flag is what
	// keeps the two views from ever disagreeing.
	const isUnderReview = comment.isFlagged && comment.moderatedAt === null;

	// A moderator's rejection and an author's own deletion both soft-delete the
	// row, so deletedAt alone cannot tell them apart. moderatedById is the
	// discriminator: it is only ever written by resolveFlaggedCommentDAL.
	//
	// Who did it is deliberately NOT exposed. The thread says a comment was
	// rejected; the identity stays on the row for the audit trail rather than
	// being published back to the people the moderator ruled on.
	const isRejected = isDeleted && comment.moderatedById !== null;

	return {
		id: comment.id,
		taskId: comment.taskId,
		authorId: comment.authorId,
		authorName: toAuthorName(author),
		authorAvatarUrl: author.imageUrl ?? "",
		parentId: comment.parentId,
		// Withheld, not just hidden by CSS. A flagged comment is quarantined
		// until a moderator rules on it, so the text must not travel to the
		// browser at all - a placeholder whose real content sits in the network
		// response is not a quarantine.
		body:
			isDeleted || isUnderReview
				? ""
				: sanitizeText(decrypt(comment.body) || comment.body),
		isDeleted,
		isUnderReview,
		isRejected,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
	};
}
