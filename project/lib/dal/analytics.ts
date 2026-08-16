import "server-only";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, tasks, workspaceMembers } from "@/lib/db/schema";
import type {
	AnalyticsDashboardDTO,
	DashboardOverviewDTO,
} from "@/lib/dtos/analytics-dto";

export async function getDashboardOverviewDAL(
	workspaceId: string,
): Promise<DashboardOverviewDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [projectsResult] = await db
			.select({ count: count() })
			.from(projects)
			.where(
				and(
					eq(projects.workspaceId, workspaceId),
					eq(projects.status, "active"),
					isNull(projects.deletedAt),
				),
			);

		const [membersResult] = await db
			.select({ count: count() })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.status, "active"),
					isNull(workspaceMembers.deletedAt),
				),
			);

		const projectRecords = await db
			.select({ id: projects.id })
			.from(projects)
			.where(
				and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)),
			);

		const projectIds = projectRecords.map((p) => p.id);

		let completedTasks = 0;
		let pendingTasks = 0;

		if (projectIds.length > 0) {
			const tasksResult = await db
				.select({
					isCompleted: tasks.isCompleted,
					count: count(),
				})
				.from(tasks)
				.where(
					and(inArray(tasks.projectId, projectIds), isNull(tasks.deletedAt)),
				)
				.groupBy(tasks.isCompleted);

			for (const row of tasksResult) {
				if (row.isCompleted) {
					completedTasks += row.count;
				} else {
					pendingTasks += row.count;
				}
			}
		}

		return {
			activeProjects: projectsResult.count,
			teamMembers: membersResult.count,
			completedTasks,
			pendingTasks,
		};
	} catch (error) {
		throw new Error("Failed to fetch dashboard overview", { cause: error });
	}
}

export async function getAnalyticsDashboardDAL(
	workspaceId: string,
): Promise<AnalyticsDashboardDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const activeProjects = await db
			.select({ id: projects.id, name: projects.name, status: projects.status })
			.from(projects)
			.where(
				and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)),
			);

		const projectIds = activeProjects.map((p) => p.id);

		let allTasks: {
			id: string;
			projectId: string;
			isCompleted: boolean;
			status: string;
			createdAt: Date;
			updatedAt: Date;
		}[] = [];
		if (projectIds.length > 0) {
			allTasks = await db
				.select({
					id: tasks.id,
					projectId: tasks.projectId,
					isCompleted: tasks.isCompleted,
					// Still selected for the status-breakdown chart, which groups by
					// the board/status label rather than by completion.
					status: tasks.status,
					createdAt: tasks.createdAt,
					updatedAt: tasks.updatedAt,
				})
				.from(tasks)
				.where(
					and(inArray(tasks.projectId, projectIds), isNull(tasks.deletedAt)),
				);
		}

		const completedTasks = allTasks.filter((t) => t.isCompleted);
		const projectVelocity = completedTasks.length;
		const teamEfficiency =
			allTasks.length > 0
				? Math.round((completedTasks.length / allTasks.length) * 100)
				: 0;

		const [membersResult] = await db
			.select({ count: count() })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					eq(workspaceMembers.status, "active"),
					isNull(workspaceMembers.deletedAt),
				),
			);
		const activeUsers = membersResult.count;

		const avgTaskTime = 4.2;

		const projectProgress = activeProjects.map((proj) => {
			const projTasks = allTasks.filter((t) => t.projectId === proj.id);
			const projCompleted = projTasks.filter((t) => t.isCompleted).length;
			const progress =
				projTasks.length > 0
					? Math.round((projCompleted / projTasks.length) * 100)
					: 0;
			return {
				name: proj.name,
				progress,
			};
		});

		const statusMap: Record<string, number> = {};
		for (const t of allTasks) {
			statusMap[t.status] = (statusMap[t.status] || 0) + 1;
		}
		const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({
			name,
			value,
		}));

		const teamActivity = [
			{ date: "Mon", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Tue", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Wed", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Thu", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Fri", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Sat", tasksCompleted: Math.floor(Math.random() * 10) },
			{ date: "Sun", tasksCompleted: Math.floor(Math.random() * 10) },
		];

		return {
			metrics: {
				projectVelocity,
				teamEfficiency,
				activeUsers,
				avgTaskTime,
			},
			projectProgress,
			statusBreakdown,
			teamActivity,
		};
	} catch (error) {
		throw new Error("Failed to fetch analytics dashboard", { cause: error });
	}
}
