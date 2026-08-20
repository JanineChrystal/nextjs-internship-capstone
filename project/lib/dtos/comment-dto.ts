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

	return {
		id: comment.id,
		taskId: comment.taskId,
		authorId: comment.authorId,
		authorName: toAuthorName(author),
		authorAvatarUrl: author.imageUrl ?? "",
		parentId: comment.parentId,
		body: isDeleted ? "" : sanitizeText(decrypt(comment.body) || comment.body),
		isDeleted,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
	};
}
