import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import {
	PRIORITY_CHART_ORDER,
	RECENT_PROJECTS_LIMIT,
	STATUS_CHART_ORDER,
	TREND_WINDOW_DAYS,
	VELOCITY_WINDOW_DAYS,
} from "@/lib/constants/analytics";
import { getCurrentUser } from "@/lib/dal/auth";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import {
	activityLogs,
	projectMembers,
	taskAssignees,
	tasks,
	users,
} from "@/lib/db/schema";
import type {
	AnalyticsDashboardDTO,
	DashboardOverviewDTO,
	ProjectAnalyticsDTO,
	RecentProjectDTO,
} from "@/lib/dtos/analytics-dto";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import {
	countPerDay,
	MILLISECONDS_PER_DAY,
	tallyBy,
	toAverageDays,
	toPercentage,
	toVelocityPerWeek,
} from "@/lib/utils/analytics";
import { deriveTaskStatus, isTaskOverdue } from "@/lib/utils/task-status";

/**
 * Everything below is scoped through getAllUserProjectsDAL() rather than through
 * projects.workspaceId.
 *
 * That is the correctness story of this file. A shared project lives in its
 * OWNER's workspace, so a member invited into it has a different workspaceId of
 * their own - and a workspace-scoped query therefore returned zero rows for
 * exactly the people the dashboard was meant to serve. Resolving the reachable
 * project ids first (owned, invited directly, or reached through a team) is the
 * same access rule the projects list already uses, so the analytics can never
 * show a project the list does not, nor miss one that it does.
 */

/** The row shape every metric below is folded from. Selected once, reused many times. */
interface ScopedTaskRow {
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

interface ProjectTaskCounts {
	total: number;
	completed: number;
}

async function loadScopedTasks(projectIds: string[]): Promise<ScopedTaskRow[]> {
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
async function loadCompletionTimes(
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
function windowStart(days: number): Date {
	const start = new Date(Date.now() - (days - 1) * MILLISECONDS_PER_DAY);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * When a completed task actually finished, falling back to updatedAt for tasks
 * completed before the activity spine existed. Without the fallback every
 * pre-Phase-1 task would silently drop out of the cycle-time average.
 */
function resolveCompletedAt(
	task: ScopedTaskRow,
	completionTimes: Map<string, Date>,
): Date {
	return completionTimes.get(task.id) ?? task.updatedAt;
}

/** The status a chart shows, which is the status the board shows. */
function toDisplayStatus(task: ScopedTaskRow): string {
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
function countTasksByProject(
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

async function loadProjectPeople(
	projectIds: string[],
): Promise<{ userId: string }[]> {
	if (projectIds.length === 0) return [];

	return db
		.select({ userId: projectMembers.userId })
		.from(projectMembers)
		.where(
			and(
				inArray(projectMembers.projectId, projectIds),
				isNull(projectMembers.deletedAt),
			),
		);
}

/**
 * Distinct people who did anything at all in the window.
 *
 * "Active users" deliberately means acted, not has an account. The previous
 * version counted workspace members, a number that never changes from one week
 * to the next and so told the reader nothing.
 */
async function loadRecentActors(
	projectIds: string[],
	since: Date,
): Promise<{ actorId: string }[]> {
	if (projectIds.length === 0) return [];

	return db
		.select({ actorId: activityLogs.actorId })
		.from(activityLogs)
		.where(
			and(
				inArray(activityLogs.projectId, projectIds),
				gte(activityLogs.createdAt, since),
				isNull(activityLogs.deletedAt),
			),
		);
}

function toRecentProjects(
	projects: ProjectOutputDTO[],
	perProject: Map<string, ProjectTaskCounts>,
): RecentProjectDTO[] {
	return [...projects]
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		.slice(0, RECENT_PROJECTS_LIMIT)
		.map((project) => {
			const counts = perProject.get(project.id) ?? { total: 0, completed: 0 };
			return {
				id: project.id,
				name: project.name,
				totalTasks: counts.total,
				completedTasks: counts.completed,
				progress: toPercentage(counts.completed, counts.total),
				updatedAt: project.updatedAt,
			};
		});
}

/**
 * The four headline numbers plus the two panels on the dashboard home page.
 *
 * Takes no workspaceId argument any more - the caller cannot be expected to know
 * which workspace a shared project belongs to, and asking it to was how the old
 * version ended up reading the wrong scope.
 */
export async function getDashboardOverviewDAL(): Promise<DashboardOverviewDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const projects = await getAllUserProjectsDAL();
		const projectIds = projects.map((project) => project.id);

		const [taskRows, memberRows, completionTimes] = await Promise.all([
			loadScopedTasks(projectIds),
			loadProjectPeople(projectIds),
			loadCompletionTimes(projectIds, windowStart(TREND_WINDOW_DAYS)),
		]);

		const completedCount = taskRows.filter((task) => task.isCompleted).length;

		const teamMembers = new Set<string>(memberRows.map((row) => row.userId));
		// The owner holds no ProjectMembers row, so they would otherwise be missing
		// from the count of their own team.
		for (const project of projects) teamMembers.add(project.ownerId);

		return {
			activeProjects: projects.filter((project) => project.status === "active")
				.length,
			teamMembers: teamMembers.size,
			completedTasks: completedCount,
			pendingTasks: taskRows.length - completedCount,
			recentProjects: toRecentProjects(projects, countTasksByProject(taskRows)),
			completionTrend: countPerDay(
				Array.from(completionTimes.values()),
				TREND_WINDOW_DAYS,
			),
		};
	} catch (error) {
		throw new Error("Failed to fetch dashboard overview", { cause: error });
	}
}

/**
 * The four metrics and four charts on the /analytics page.
 *
 * One pass over one task result set feeds all eight. The alternative - a GROUP BY
 * per chart - would be four extra round-trips over identical rows, and each one
 * would have to restate the access scope, which is four more places for the
 * scoping bug described at the top of this file to come back.
 */
export async function getAnalyticsDashboardDAL(): Promise<AnalyticsDashboardDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const projects = await getAllUserProjectsDAL();
		const projectIds = projects.map((project) => project.id);

		const [taskRows, completionTimes, actorRows] = await Promise.all([
			loadScopedTasks(projectIds),
			loadCompletionTimes(projectIds, windowStart(VELOCITY_WINDOW_DAYS)),
			loadRecentActors(projectIds, windowStart(TREND_WINDOW_DAYS)),
		]);

		const completedTasks = taskRows.filter((task) => task.isCompleted);
		const completionsInWindow = Array.from(completionTimes.values());

		// Cycle time is measured only over tasks whose completion falls inside the
		// window, so the figure tracks how the team works now. Averaging every task
		// ever completed would let one abandoned item from months ago dominate.
		const cycleTimes = completedTasks
			.filter((task) => completionTimes.has(task.id))
			.map(
				(task) =>
					resolveCompletedAt(task, completionTimes).getTime() -
					task.createdAt.getTime(),
			);

		const perProject = countTasksByProject(taskRows);

		return {
			metrics: {
				projectVelocity: toVelocityPerWeek(
					completionsInWindow.length,
					VELOCITY_WINDOW_DAYS,
				),
				teamEfficiency: toPercentage(completedTasks.length, taskRows.length),
				activeUsers: new Set(actorRows.map((row) => row.actorId)).size,
				avgTaskTime: toAverageDays(cycleTimes),
			},
			projectProgress: projects
				.map((project) => {
					const counts = perProject.get(project.id) ?? {
						total: 0,
						completed: 0,
					};
					return {
						name: project.name,
						completedTasks: counts.completed,
						totalTasks: counts.total,
						progress: toPercentage(counts.completed, counts.total),
					};
				})
				// A project with no tasks has no progress to compare, and drawing it as
				// a 0% bar reads as "behind" rather than "not started".
				.filter((row) => row.totalTasks > 0)
				.sort((a, b) => b.progress - a.progress),
			statusBreakdown: tallyBy(taskRows, toDisplayStatus, STATUS_CHART_ORDER),
			priorityBreakdown: tallyBy(
				taskRows,
				(task) => task.priority,
				PRIORITY_CHART_ORDER,
			),
			teamActivity: countPerDay(completionsInWindow, TREND_WINDOW_DAYS),
		};
	} catch (error) {
		throw new Error("Failed to fetch analytics dashboard", { cause: error });
	}
}

/**
 * One row per assignment, joined to the person's name.
 *
 * Returned unaggregated so tallyBy can count it with the same code path as the
 * status and priority charts - the alternative was a fourth GROUP BY producing
 * an identical shape.
 */
async function loadProjectWorkload(
	projectId: string,
): Promise<{ name: string }[]> {
	const rows = await db
		.select({
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
		})
		.from(taskAssignees)
		.innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
		.innerJoin(users, eq(taskAssignees.userId, users.id))
		.where(
			and(
				eq(tasks.projectId, projectId),
				isNull(tasks.deletedAt),
				isNull(taskAssignees.deletedAt),
			),
		)
		.orderBy(desc(tasks.createdAt));

	return rows.map((row) => ({
		name:
			[row.firstName, row.lastName].filter(Boolean).join(" ") ||
			row.email.split("@")[0],
	}));
}

/**
 * The Charts tab inside a single project.
 *
 * Gated by project role rather than by the accessible-projects list: this one
 * takes an id straight from the URL, so it has to prove the caller may read that
 * specific project before it reads anything at all.
 */
export async function getProjectAnalyticsDAL(
	projectId: string,
): Promise<ProjectAnalyticsDTO> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const [taskRows, completionTimes, assigneeRows] = await Promise.all([
			loadScopedTasks([projectId]),
			loadCompletionTimes([projectId]),
			loadProjectWorkload(projectId),
		]);

		const completedTasks = taskRows.filter((task) => task.isCompleted);

		const cycleTimes = completedTasks.map(
			(task) =>
				resolveCompletedAt(task, completionTimes).getTime() -
				task.createdAt.getTime(),
		);

		const trendStart = windowStart(TREND_WINDOW_DAYS).getTime();
		const recentCompletions = completedTasks
			.map((task) => resolveCompletedAt(task, completionTimes))
			.filter((date) => date.getTime() >= trendStart);

		return {
			totalTasks: taskRows.length,
			completedTasks: completedTasks.length,
			overdueTasks: taskRows.filter((task) =>
				isTaskOverdue({ isCompleted: task.isCompleted, dueDate: task.dueDate }),
			).length,
			progress: toPercentage(completedTasks.length, taskRows.length),
			avgTaskTime: toAverageDays(cycleTimes),
			statusBreakdown: tallyBy(taskRows, toDisplayStatus, STATUS_CHART_ORDER),
			priorityBreakdown: tallyBy(
				taskRows,
				(task) => task.priority,
				PRIORITY_CHART_ORDER,
			),
			workload: tallyBy(assigneeRows, (row) => row.name),
			completionTrend: countPerDay(recentCompletions, TREND_WINDOW_DAYS),
		};
	} catch (error) {
		throw new Error("Failed to fetch project analytics", { cause: error });
	}
}
