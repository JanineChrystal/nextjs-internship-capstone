"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { recordActivity } from "@/lib/dal/activity-recorder";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { resolveProjectWorkspaceIdDAL } from "@/lib/dal/categories";
import {
	createCommentMentionsDAL,
	resolveMentionsDAL,
} from "@/lib/dal/comment-mentions";
import {
	applyModerationVerdictDAL,
	markCommentForProfanityRetryDAL,
} from "@/lib/dal/comment-moderation";
import {
	createCommentInDB,
	deleteCommentInDB,
	getCommentParentId,
	getCommentsByTaskId,
	updateCommentInDB,
} from "@/lib/dal/comments";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import { getTaskAssigneesByTaskIds } from "@/lib/dal/task-assignees";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import { detectProfanity } from "@/lib/profanity";
import {
	CreateCommentSchema,
	UpdateCommentSchema,
} from "@/lib/validations/comment-schema";
import { sendNotification } from "@/lib/email/send-notification";
import { CommentMentionEmail } from "@/app/(dashboard)/notifications/_components/email/comment-mention-email";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function getCommentsAction(
	taskId: string,
	projectId: string,
	limit = 20,
	offset = 0,
): Promise<{
	success: boolean;
	data?: CommentOutputDTO[];
	hasMore?: boolean;
	error?: string;
}> {
	try {
		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"view_project",
		);
		if (!hasPermission)
			return { success: false, error: await getSessionFailureReason() };

		const result = await getCommentsByTaskId(taskId, projectId, limit, offset);
		return { success: true, data: result.comments, hasMore: result.hasMore };
	} catch (error) {
		console.error("getCommentsAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function createCommentAction(
	taskId: string,
	projectId: string,
	body: string,
	parentId?: string,
): Promise<{ success: boolean; data?: CommentOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const hasPermission = await verifyProjectPermissionDAL(
			projectId,
			"comment_task",
		);
		if (!hasPermission)
			return { success: false, error: await getSessionFailureReason() };

		const validationResult = CreateCommentSchema.safeParse({ body, parentId });
		if (!validationResult.success) {
			return { success: false, error: "Invalid comment" };
		}

		if (validationResult.data.parentId) {
			const grandparentId = await getCommentParentId(
				validationResult.data.parentId,
			);
			if (grandparentId) {
				return { success: false, error: "Cannot reply to a reply" };
			}
		}

		const comment = await createCommentInDB(
			taskId,
			projectId,
			user.id,
			validationResult.data.body,
			validationResult.data.parentId,
		);

		// The people working on the task are the ones who need to know it was
		// commented on. recordActivity drops the author if they are among them, so
		// commenting on your own task notifies nobody.
		const assigneesByTask = await getTaskAssigneesByTaskIds([taskId]);
		const assignees = assigneesByTask.get(taskId) ?? [];

		await recordActivity({
			workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
			actorId: user.id,
			actionType: "COMMENT_ADDED",
			details: "Commented on this task",
			projectId,
			taskId,
			notify: assignees.map((assignee) => ({
				recipientId: assignee.userId,
				message: "New comment on a task assigned to you",
			})),
		});

		// Mentions are resolved from the BODY, server-side, never from a list of
		// ids the client sent - otherwise a caller could post an innocuous comment
		// and notify anyone they liked. Only project members resolve; anything
		// else is dropped.
		const mentioned = await resolveMentionsDAL(
			validationResult.data.body,
			projectId,
		);

		if (mentioned.length > 0) {
			await createCommentMentionsDAL(
				comment.id,
				mentioned.map((mention) => mention.userId),
			);

			await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "COMMENT_ADDED",
				details: "Mentioned someone in a comment",
				projectId,
				taskId,
				// recordActivity drops the actor, so mentioning yourself notifies
				// nobody.
				notify: mentioned.map((mention) => ({
					recipientId: mention.userId,
					message: "You were mentioned in a comment",
				})),
			});

			after(async () => {
				try {
					const mentionedUserIds = mentioned.map((m) => m.userId);
					const [taskResult, mentionedUsers] = await Promise.all([
						db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, taskId)).limit(1),
						db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, mentionedUserIds))
					]);
					
					const taskName = taskResult[0]?.name || "a task";
					const mentionedBy = user.firstName 
						? `${user.firstName} ${user.lastName || ""}`.trim() 
						: user.email;

					// E.g. https://yourdomain.com/projects/[projectId]?task=[taskId]
					const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects/${projectId}?task=${taskId}`;

					for (const mentionedUser of mentionedUsers) {
						await sendNotification({
							userId: mentionedUser.id,
							to: mentionedUser.email,
							subject: `${mentionedBy} mentioned you on a task`,
							type: "emailCommentMentions",
							template: CommentMentionEmail({
								mentionedBy,
								taskName,
								commentBody: validationResult.data.body,
								taskUrl,
							})
						});
					}
				} catch (error) {
					console.error("Failed to send mention emails:", error);
				}
			});
		}

		// Moderation runs AFTER the response, not in front of the insert.
		//
		// The plan called for checking before storing, on the reasoning that a
		// comment must never be stored unflagged and then flagged later. Measuring
		// the live API changed that: it answers in 450-650ms warm but takes 4.5s
		// cold and was seen at 6.9s, and every one of those seconds would be spent
		// with the author watching a spinner.
		//
		// It is safe to move because this system FLAGS rather than BLOCKS - the
		// comment is visible either way, so the only thing that arrives late is a
		// row in the moderation queue. Nobody sees a difference; the author gets
		// their comment instantly instead.
		after(async () => {
			try {
				const verdict = await detectProfanity(validationResult.data.body);

				if (verdict.failedDetectors && verdict.failedDetectors.length > 0) {
					await markCommentForProfanityRetryDAL(comment.id);
				}

				if (!verdict.isFlagged) return;

				await applyModerationVerdictDAL(comment.id, true, verdict.reason);
			} catch (error) {
				// Never rethrown: the response has already gone, and a moderation
				// failure must not cost anyone their comment.
				console.error("Comment moderation failed:", error);
			}
		});

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: comment };
	} catch (error) {
		console.error("createCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function updateCommentAction(
	commentId: string,
	projectId: string,
	body: string,
): Promise<{ success: boolean; data?: CommentOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const validationResult = UpdateCommentSchema.safeParse({ body });
		if (!validationResult.success) {
			return { success: false, error: "Invalid comment" };
		}

		const comment = await updateCommentInDB(
			commentId,
			user.id,
			validationResult.data.body,
		);
		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: comment };
	} catch (error) {
		console.error("updateCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}

export async function deleteCommentAction(
	commentId: string,
	projectId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const canModerate = await verifyProjectPermissionDAL(
			projectId,
			"edit_task",
		);

		await deleteCommentInDB(commentId, user.id, canModerate);
		revalidatePath(`/projects/${projectId}`);
		return { success: true };
	} catch (error) {
		console.error("deleteCommentAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
