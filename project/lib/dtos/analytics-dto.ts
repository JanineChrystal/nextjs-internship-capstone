/**
 * analytics dtos - defines pre-computed shapes for analytics surfaces,
 * ensuring calculations occur purely in the DAL so that charts, tables,
 * and tiles share exactly the same mathematical logic.
 */

/**
 * daily count dto - represents a single day within a trailing window,
 * providing both a sortable date key and an axis-ready label.
 */
export interface DailyCountDTO {
	date: string;
	label: string;
	tasksCompleted: number;
}

/**
 * chart slice dto - describes a named slice of a whole, such as task statuses
 * or per-member workloads.
 */
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

/**
 * status totals dto - defines counts across the four core task statuses,
 * exposed as a type alias instead of an interface to maintain assignability
 * to the generic Record<string, number> required by chart components.
 */
export type StatusTotalsDTO = {
	notStarted: number;
	inProgress: number;
	overdue: number;
	completed: number;
};

/**
 * stacked group dto - defines one column of a stacked chart, including a
 * category, its total, and the internal status split, shared identically by
 * multiple panels.
 */
export interface StackedGroupDTO {
	name: string;
	total: number;
	segments: StatusTotalsDTO;
}

export interface ProjectAnalyticsDTO {
	totalTasks: number;
	completedTasks: number;
	/** The figure printed in the middle of the Status ring. */
	tasksLeft: number;
	statusTotals: StatusTotalsDTO;
	byPriority: StackedGroupDTO[];
	byBucket: StackedGroupDTO[];
	byMember: StackedGroupDTO[];
}
