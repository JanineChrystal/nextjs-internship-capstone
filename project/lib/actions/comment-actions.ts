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

		// Moderation runs BEFORE the insert, and covers every detector at once.
		//
		// An earlier version checked only the in-process word list here and left
		// the API call for after(). That was faster, but it gave English and
		// Filipino profanity two visibly different behaviours: one warned the
		// author immediately, the other flagged the comment silently some seconds
		// later. Same offence, same system, two different experiences.
		//
		// Waiting for both costs about 400ms against a warm API and is capped by
		// PROFANITY_API_TIMEOUT_MS. A detector that fails or times out is recorded
		// in failedDetectors and the comment is re-examined by the retry, so the
		// price of the cap is a late verdict rather than a missed one.
		const verdict = await detectProfanity(validationResult.data.body);

		const comment = await createCommentInDB(
			taskId,
			projectId,
			user.id,
			validationResult.data.body,
			validationResult.data.parentId,
		);

		// The verdict is already in hand, so it lands on the row before the
		// response goes out: the moderation queue is accurate the moment anyone
		// looks, and the composer can tell the author in the same breath.
		if (verdict.isFlagged) {
			await applyModerationVerdictDAL(comment.id, true, verdict.reason);
		}

		// Only an UNFLAGGED comment is worth rechecking. A failed detector on a
		// comment that is already flagged could at most widen the reason from
		// "English profanity" to "English and Filipino profanity" - it cannot
		// change the outcome, and the comment is already sitting in the queue.
		//
		// Marking those pending as well produced a genuinely confusing screen:
		// the same two comments appeared in the flagged table AND under "could
		// not be checked", which reads as a contradiction. Pending now means what
		// it says - nobody reached a verdict on this one.
		if (
			!verdict.isFlagged &&
			verdict.failedDetectors &&
			verdict.failedDetectors.length > 0
		) {
			await markCommentForProfanityRetryDAL(comment.id);
		}

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
							userId: mentionedUser.id,
							to: mentionedUser.email,
							subject: `${mentionedBy} mentioned you on a task`,
							type: "emailCommentMentions",
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
