/**
 * The shapes the analytics surfaces render.
 *
 * Deliberately flat and already-computed: a chart component should never have to
 * divide, filter or bucket anything. Every number a chart draws is calculated in
 * the DAL (using the pure helpers in lib/utils/analytics.ts) and handed over
 * finished, so the same DTO can feed a chart, a table or a stat tile without any
 * of them disagreeing about the maths.
 */

/** One day of a trailing window. `date` is a sortable key, `label` is for the axis. */
export interface DailyCountDTO {
	date: string;
	label: string;
	tasksCompleted: number;
}

/** A named slice of a whole - task statuses, priorities, per-member workload. */
export interface ChartSliceDTO {
	name: string;
	value: number;
}

export interface RecentProjectDTO {
	id: string;
	name: string;
	progress: number;
	totalTasks: number;
	completedTasks: number;
	updatedAt: Date;
}

export interface DashboardOverviewDTO {
	activeProjects: number;
	teamMembers: number;
	completedTasks: number;
	pendingTasks: number;
	recentProjects: RecentProjectDTO[];
	completionTrend: DailyCountDTO[];
}

export interface AnalyticsMetricsDTO {
	/** Tasks completed per week, averaged over the velocity window. */
	projectVelocity: number;
	/** Completed / total tasks, as a percentage. */
	teamEfficiency: number;
	/** Distinct people who recorded any activity inside the trend window. */
	activeUsers: number;
	/** Mean days from task creation to task completion. */
	avgTaskTime: number;
}

export interface ProjectProgressChartDTO {
	name: string;
	progress: number;
	completedTasks: number;
	totalTasks: number;
}

export interface AnalyticsDashboardDTO {
	metrics: AnalyticsMetricsDTO;
	projectProgress: ProjectProgressChartDTO[];
	statusBreakdown: ChartSliceDTO[];
	priorityBreakdown: ChartSliceDTO[];
	teamActivity: DailyCountDTO[];
}

export interface ProjectAnalyticsDTO {
	totalTasks: number;
	completedTasks: number;
	overdueTasks: number;
	progress: number;
	avgTaskTime: number;
	statusBreakdown: ChartSliceDTO[];
	priorityBreakdown: ChartSliceDTO[];
	workload: ChartSliceDTO[];
	completionTrend: DailyCountDTO[];
}
