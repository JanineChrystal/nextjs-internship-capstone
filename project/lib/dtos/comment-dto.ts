import type { DbComment } from "@/lib/types/activity";

export interface CommentOutputDTO {
	id: string;
	taskId: string;
	authorId: string;
	authorName: string;
	authorAvatarUrl: string;
	parentId: string | null;
	body: string;
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
	return {
		id: comment.id,
		taskId: comment.taskId,
		authorId: comment.authorId,
		authorName: toAuthorName(author),
		authorAvatarUrl: author.imageUrl ?? "",
		parentId: comment.parentId,
		body: sanitizeText(comment.body),
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
	};
}
