import "server-only";
import { and, gte, inArray, isNull } from "drizzle-orm";
import {
	PRIORITY_CHART_ORDER,
	RECENT_PROJECTS_LIMIT,
	STATUS_CHART_ORDER,
	TREND_WINDOW_DAYS,
	VELOCITY_WINDOW_DAYS,
} from "@/lib/constants/analytics";
import {
	countTasksByProject,
	loadCompletionTimes,
	loadScopedTasks,
	type ProjectTaskCounts,
	resolveCompletedAt,
	toDisplayStatus,
	windowStart,
} from "@/lib/dal/analytics-queries";
import { getCurrentUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import { activityLogs, projectMembers } from "@/lib/db/schema";
import type {
	AnalyticsDashboardDTO,
	DashboardOverviewDTO,
	RecentProjectDTO,
} from "@/lib/dtos/analytics-dto";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import {
	countPerDay,
	tallyBy,
	toAverageDays,
	toPercentage,
	toVelocityPerWeek,
} from "@/lib/utils/analytics";

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
