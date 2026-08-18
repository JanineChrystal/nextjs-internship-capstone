import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { taskAssignees, tasks, users } from "@/lib/db/schema";
import { toMemberName } from "@/lib/dtos/project-member-dto";
import type { Assignee } from "@/lib/types/task";

export async function getTaskAssigneesByTaskIds(
	taskIds: string[],
): Promise<Map<string, Assignee[]>> {
	const assigneesByTask = new Map<string, Assignee[]>();
	if (taskIds.length === 0) return assigneesByTask;

	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const rows = await db
			.select({ taskId: taskAssignees.taskId, member: users })
			.from(taskAssignees)
			.innerJoin(users, eq(taskAssignees.userId, users.id))
			.where(
				and(
					inArray(taskAssignees.taskId, taskIds),
					isNull(taskAssignees.deletedAt),
				),
			);

		for (const row of rows) {
			const list = assigneesByTask.get(row.taskId) ?? [];
			list.push({
				userId: row.member.id,
				name: toMemberName(row.member),
				email: row.member.email,
				avatarUrl: row.member.imageUrl ?? "",
			});
			assigneesByTask.set(row.taskId, list);
		}

		return assigneesByTask;
	} catch (error) {
		throw new Error("Failed to fetch task assignees from database", {
			cause: error,
		});
	}
}

/**
 * Replaces a task's assignee list and reports who was newly added.
 *
 * The returned ids are what let the caller notify only the people who just
 * gained the task. This function replaces the whole list on every save, so
 * without the diff a caller could only notify *all* current assignees - which
 * would re-notify the same people every time anything about the assignment
 * changed. The old list is read here because this is the only place that sees
 * both states; asking the action layer to diff would mean querying twice.
 */
export async function setTaskAssigneesInDB(
	taskId: string,
	projectId: string,
	userIds: string[],
): Promise<{ addedUserIds: string[] }> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [task] = await db
			.select({ id: tasks.id })
			.from(tasks)
			.where(
				and(
					eq(tasks.id, taskId),
					eq(tasks.projectId, projectId),
					isNull(tasks.deletedAt),
				),
			);
		if (!task) throw new Error("Task not found");

		const existing = await db
			.select({ userId: taskAssignees.userId })
			.from(taskAssignees)
			.where(
				and(eq(taskAssignees.taskId, taskId), isNull(taskAssignees.deletedAt)),
			);

		const before = new Set(existing.map((row) => row.userId));
		const addedUserIds = userIds.filter((userId) => !before.has(userId));

		await db.transaction(async (tx) => {
			await tx
				.update(taskAssignees)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(
					and(
						eq(taskAssignees.taskId, taskId),
						isNull(taskAssignees.deletedAt),
					),
				);

			if (userIds.length > 0) {
				await tx
					.insert(taskAssignees)
					.values(userIds.map((userId) => ({ taskId, userId })))
					.onConflictDoUpdate({
						target: [taskAssignees.taskId, taskAssignees.userId],
						set: { deletedAt: null, updatedAt: new Date() },
					});
			}
		});

		return { addedUserIds };
	} catch (error) {
		if (error instanceof Error && error.message === "Task not found")
			throw error;
		throw new Error("Failed to set task assignees in database", {
			cause: error,
		});
	}
}
