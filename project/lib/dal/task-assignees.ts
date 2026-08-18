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

export async function setTaskAssigneesInDB(
	taskId: string,
	projectId: string,
	userIds: string[],
): Promise<void> {
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
	} catch (error) {
		throw new Error("Failed to set task assignees in database", {
			cause: error,
		});
	}
}
