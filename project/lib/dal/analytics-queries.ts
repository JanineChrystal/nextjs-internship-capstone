import "server-only";
import { and, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, tasks } from "@/lib/db/schema";
import { MILLISECONDS_PER_DAY } from "@/lib/utils/analytics";
import { deriveTaskStatus } from "@/lib/utils/task-status";

/**
 * analytics query helpers - centralizes data loading functions shared
 * by both workspace and project analytics to separate data retrieval
 * ("what rows exist") from domain interpretation ("what the rows
 * mean").
 */

/** scoped task row - defines the minimal data projection required to compute all task metrics in a single pass. */
export interface ScopedTaskRow {
	id: string;
	projectId: string;
	isCompleted: boolean;
	status: string;
	statusOverriddenAt: Date | null;
	priority: string;
	dueDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProjectTaskCounts {
	total: number;
	completed: number;
}

export async function loadScopedTasks(
	projectIds: string[],
): Promise<ScopedTaskRow[]> {
	if (projectIds.length === 0) return [];

	return db
		.select({
			id: tasks.id,
			projectId: tasks.projectId,
			isCompleted: tasks.isCompleted,
			status: tasks.status,
			statusOverriddenAt: tasks.statusOverriddenAt,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
		})
		.from(tasks)
		.where(
			and(
				inArray(tasks.projectId, projectIds),
				/**
				 * exclude archived tasks - ignores archived work in analytical
				 * counts so abandoned tasks do not artificially deflate completion
				 * metrics.
				 */
				isNull(tasks.archivedAt),
				isNull(tasks.deletedAt),
			),
		);
}

/**
 * load completion times - resolves true task completion dates by
 * querying immutable activity logs rather than volatile updatedAt
 * columns. It takes the earliest completion record to handle toggled
 * task states correctly.
 */
export async function loadCompletionTimes(
	projectIds: string[],
	since?: Date,
): Promise<Map<string, Date>> {
	if (projectIds.length === 0) return new Map();

	const rows = await db
		.select({ taskId: activityLogs.taskId, createdAt: activityLogs.createdAt })
		.from(activityLogs)
		.where(
			and(
				inArray(activityLogs.projectId, projectIds),
				eq(activityLogs.actionType, "TASK_COMPLETED"),
				isNotNull(activityLogs.taskId),
				isNull(activityLogs.deletedAt),
				since ? gte(activityLogs.createdAt, since) : undefined,
			),
		);

	const earliest = new Map<string, Date>();
	for (const row of rows) {
		if (!row.taskId) continue;
		const seen = earliest.get(row.taskId);
		if (!seen || row.createdAt < seen) earliest.set(row.taskId, row.createdAt);
	}
	return earliest;
}

/** window start - calculates the start of the local day a given trailing window opens on. */
export function windowStart(days: number): Date {
	const start = new Date(Date.now() - (days - 1) * MILLISECONDS_PER_DAY);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * resolve completed at - determines task completion times with a
 * fallback to updatedAt to ensure legacy tasks (pre-activity log)
 * remain included in cycle time averages.
 */
export function resolveCompletedAt(
	task: ScopedTaskRow,
	completionTimes: Map<string, Date>,
): Date {
	return completionTimes.get(task.id) ?? task.updatedAt;
}

/** display status - derives the correct status for charts, mirroring the board's dynamic status logic. */
export function toDisplayStatus(task: ScopedTaskRow): string {
	return deriveTaskStatus({
		isCompleted: task.isCompleted,
		status: task.status,
		dueDate: task.dueDate,
		statusOverriddenAt: task.statusOverriddenAt,
	});
}

/**
 * count tasks by project - computes total and completed task counts
 * for all projects in a single O(N) pass to avoid expensive nested
 * iterations.
 */
export function countTasksByProject(
	taskRows: ScopedTaskRow[],
): Map<string, ProjectTaskCounts> {
	const perProject = new Map<string, ProjectTaskCounts>();

	for (const task of taskRows) {
		const bucket = perProject.get(task.projectId) ?? { total: 0, completed: 0 };
		bucket.total += 1;
		if (task.isCompleted) bucket.completed += 1;
		perProject.set(task.projectId, bucket);
	}

	return perProject;
}
