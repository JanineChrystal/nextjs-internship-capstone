export interface DashboardOverviewDTO {
	activeProjects: number;
	teamMembers: number;
	completedTasks: number;
	pendingTasks: number;
}

export interface AnalyticsMetricsDTO {
	projectVelocity: number;
	teamEfficiency: number;
	activeUsers: number;
	avgTaskTime: number;
}

export interface ProjectProgressChartDTO {
	name: string;
	progress: number;
}

export interface TeamActivityTimelineDTO {
	date: string;
	tasksCompleted: number;
}

export interface AnalyticsDashboardDTO {
	metrics: AnalyticsMetricsDTO;
	projectProgress: ProjectProgressChartDTO[];
	teamActivity: TeamActivityTimelineDTO[];
	statusBreakdown: { name: string; value: number }[];
}
