"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CommentMentionEmail } from "@/app/(dashboard)/notifications/_components/email/comment-mention-email";
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
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import type { CommentOutputDTO } from "@/lib/dtos/comment-dto";
import { sendNotification } from "@/lib/email/send-notification";
import { detectProfanity } from "@/lib/profanity";
import type { CreateCommentResult } from "@/lib/types/comment";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
	CreateCommentSchema,
	UpdateCommentSchema,
} from "@/lib/validations/comment-schema";

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
): Promise<CreateCommentResult> {
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

		/**
		 * synchronous moderation - runs all profanity detectors before
		 * insert to ensure consistent user experience across languages,
		 * falling back to retries if limits are hit.
		 */
		const verdict = await detectProfanity(validationResult.data.body);

		const comment = await createCommentInDB(
			taskId,
			projectId,
			user.id,
			validationResult.data.body,
			validationResult.data.parentId,
		);

		/**
		 * immediate verdict application - applies the moderation decision
		 * immediately to keep the queue accurate and inform the author
		 * instantly.
		 */
		if (verdict.isFlagged) {
			await applyModerationVerdictDAL(comment.id, true, verdict.reason);
		}

		/**
		 * pending state criteria - only marks unflagged comments for retry
		 * to avoid contradictory UI states where a comment is both flagged
		 * and pending check.
		 */
		if (
			!verdict.isFlagged &&
			verdict.failedDetectors &&
			verdict.failedDetectors.length > 0
		) {
			await markCommentForProfanityRetryDAL(comment.id);
		}

		/**
		 * assignee notification - notifies task assignees about new
		 * comments, excluding the author from the notification list.
		 */
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
				/**
				 * unfiltered task notification - sends emails for task comments
				 * without checking mention preferences, as they are distinct
				 * notification categories.
				 */
				emailPreference: null,
			})),
		});

		/**
		 * server-side mention resolution - extracts mentions from the
		 * comment body on the server to prevent spoofing and restricts
		 * resolution to project members.
		 */
		const mentioned = await resolveMentionsDAL(
			validationResult.data.body,
			projectId,
		);

		if (mentioned.length > 0) {
			await createCommentMentionsDAL(
				comment.id,
				mentioned.map((mention) => mention.userId),
			);

			const recorded = await recordActivity({
				workspaceId: await resolveProjectWorkspaceIdDAL(projectId),
				actorId: user.id,
				actionType: "COMMENT_ADDED",
				details: "Mentioned someone in a comment",
				projectId,
				taskId,
				/**
				 * self-mention filtering - relies on recordActivity to drop the
				 * actor from notifications when mentioning themselves.
				 */
				notify: mentioned.map((mention) => ({
					recipientId: mention.userId,
					message: "You were mentioned in a comment",
					emailPreference: "emailCommentMentions" as const,
				})),
			});

			/**
			 * consolidated email preferences - pre-filters recipients based on
			 * their email settings resolved by the DAL.
			 */
			const mayEmail = new Set(
				recorded
					.filter((entry) => entry.shouldSendEmail)
					.map((entry) => entry.recipientId),
			);

			after(async () => {
				try {
					const mentionedUserIds = mentioned.map((m) => m.userId);
					const [taskResult, mentionedUsers] = await Promise.all([
						db
							.select({ name: tasks.name })
							.from(tasks)
							.where(eq(tasks.id, taskId))
							.limit(1),
						db
							.select({ id: users.id, email: users.email })
							.from(users)
							.where(inArray(users.id, mentionedUserIds)),
					]);

					const taskName = taskResult[0]?.name || "a task";
					const mentionedBy = user.firstName
						? `${user.firstName} ${user.lastName || ""}`.trim()
						: user.email;

					// E.g. https://yourdomain.com/projects/[projectId]?task=[taskId]
					const taskUrl = `${getAppBaseUrl()}/projects/${projectId}?task=${taskId}`;

					for (const mentionedUser of mentionedUsers) {
						await sendNotification({
							to: mentionedUser.email,
							subject: `${mentionedBy} mentioned you on a task`,
							shouldSend: mayEmail.has(mentionedUser.id),
							template: CommentMentionEmail({
								mentionedBy,
								taskName,
								commentBody: validationResult.data.body,
								taskUrl,
							}),
						});
					}
				} catch (error) {
					console.error("Failed to send mention emails:", error);
				}
			});
		}

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: comment, underReview: verdict.isFlagged };
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
