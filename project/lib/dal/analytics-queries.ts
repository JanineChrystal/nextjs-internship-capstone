import "server-only";
import { and, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, tasks } from "@/lib/db/schema";
import { MILLISECONDS_PER_DAY } from "@/lib/utils/analytics";
import { deriveTaskStatus } from "@/lib/utils/task-status";

/**
 * The row loaders and helpers shared by the workspace-wide analytics
 * (lib/dal/analytics.ts) and the per-project analytics
 * (lib/dal/project-analytics.ts).
 *
 * Extracted when analytics.ts crossed the 400-line limit. The split is along a
 * real seam rather than an arbitrary one: these functions answer "what rows are
 * there", while the two files that import them answer "what do those rows mean
 * for this particular screen". Two reasons to change, two files.
 */

/** The row shape every metric is folded from. Selected once, reused many times. */
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
		.where(and(inArray(tasks.projectId, projectIds), isNull(tasks.deletedAt)));
}

/**
 * When each task was completed, read from the activity spine Phase 1 installed.
 *
 * The Tasks table has no completedAt column, and updatedAt is the wrong stand-in
 * because it moves every time anyone edits a note or renames the task - a task
 * finished in March but retitled today would report a cycle time of zero days.
 * The TASK_COMPLETED activity row, by contrast, is written once and never moved.
 *
 * The earliest such row wins: a task that is un-completed and completed again
 * should keep its original cycle time rather than restarting the clock.
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

/** The start of the local day this trailing window opens on. */
export function windowStart(days: number): Date {
	const start = new Date(Date.now() - (days - 1) * MILLISECONDS_PER_DAY);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * When a completed task actually finished, falling back to updatedAt for tasks
 * completed before the activity spine existed. Without the fallback every
 * pre-Phase-1 task would silently drop out of the cycle-time average.
 */
export function resolveCompletedAt(
	task: ScopedTaskRow,
	completionTimes: Map<string, Date>,
): Date {
	return completionTimes.get(task.id) ?? task.updatedAt;
}

/** The status a chart shows, which is the status the board shows. */
export function toDisplayStatus(task: ScopedTaskRow): string {
	return deriveTaskStatus({
		isCompleted: task.isCompleted,
		status: task.status,
		dueDate: task.dueDate,
		statusOverriddenAt: task.statusOverriddenAt,
	});
}

/**
 * Total and completed task counts per project, in one pass.
 *
 * Filtering the task array once per project instead would be an
 * O(projects x tasks) scan for numbers a single pass already has.
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
