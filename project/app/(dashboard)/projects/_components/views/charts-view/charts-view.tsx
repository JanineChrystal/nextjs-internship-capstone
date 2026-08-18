"use client";

import { BarChart3 } from "lucide-react";
import {
	ChartCard,
	OrdinalBarChart,
	RankedBarChart,
	ShareBarChart,
	TrendAreaChart,
} from "@/components/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TREND_WINDOW_DAYS } from "@/lib/constants/analytics";
import { StatCard } from "../../../../_components/ui/cards/stat-card";
import {
	PROJECT_CHART_ICONS,
	toPriorityLabel,
} from "../../../../_constants/analytics";
import { useProjectAnalytics } from "../../../_hooks/use-project-analytics";

interface ChartsViewProps {
	projectId: string;
}

/**
 * The Charts tab of a single project.
 *
 * Every chart on this screen is the same component the /analytics page uses,
 * handed a narrower query. That is the whole reason the chart components take
 * {label, value} instead of a task DTO: two surfaces, one implementation, and no
 * chance of the project view and the workspace view disagreeing about what a
 * stacked bar looks like.
 */
export function ChartsView({ projectId }: ChartsViewProps) {
	const { analytics, isLoading } = useProjectAnalytics(projectId);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{["total", "completed", "overdue", "progress"].map((key) => (
						<Skeleton key={key} className="h-28 rounded-xl" />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Skeleton className="h-72 rounded-xl lg:col-span-2" />
					<Skeleton className="h-72 rounded-xl" />
					<Skeleton className="h-72 rounded-xl" />
				</div>
			</div>
		);
	}

	if (!analytics || analytics.totalTasks === 0) {
		return (
			<EmptyState
				icon={BarChart3}
				title="Nothing to chart yet"
				description="Add a few tasks to this project and its charts will fill in."
			/>
		);
	}

	const trend = analytics.completionTrend.map((day) => ({
		label: day.label,
		value: day.tasksCompleted,
	}));
	const statuses = analytics.statusBreakdown.map((slice) => ({
		label: slice.name,
		value: slice.value,
	}));
	const priorities = analytics.priorityBreakdown.map((slice) => ({
		label: toPriorityLabel(slice.name),
		value: slice.value,
	}));
	const workload = analytics.workload.map((slice) => ({
		label: slice.name,
		value: slice.value,
	}));

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					label="Total Tasks"
					value={analytics.totalTasks}
					icon={PROJECT_CHART_ICONS.total}
				/>
				<StatCard
					label="Completed"
					value={analytics.completedTasks}
					unit={`${analytics.progress}% of all tasks`}
					icon={PROJECT_CHART_ICONS.completed}
				/>
				<StatCard
					label="Overdue"
					value={analytics.overdueTasks}
					icon={PROJECT_CHART_ICONS.overdue}
					hint="Past the due date and not yet completed."
				/>
				<StatCard
					label="Avg. Task Time"
					value={analytics.avgTaskTime}
					unit="days"
					icon={PROJECT_CHART_ICONS.progress}
					hint="Mean days from creation to completion."
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<ChartCard
					title="Completion trend"
					description={`Tasks completed per day over the last ${TREND_WINDOW_DAYS} days.`}
					tableRows={trend}
					tableValueLabel="Tasks completed"
					className="lg:col-span-2"
				>
					<TrendAreaChart data={trend} seriesLabel="Tasks completed" />
				</ChartCard>

				<ChartCard
					title="Task status"
					description="How this project's tasks split across statuses."
					tableRows={statuses}
					tableValueLabel="Tasks"
				>
					<ShareBarChart data={statuses} unitLabel="tasks" />
				</ChartCard>

				<ChartCard
					title="Priority distribution"
					description="Where this project's work sits on the priority scale."
					tableRows={priorities}
					tableValueLabel="Tasks"
				>
					<OrdinalBarChart data={priorities} seriesLabel="Tasks" />
				</ChartCard>

				<ChartCard
					title="Workload by assignee"
					description="Tasks currently assigned to each person."
					tableRows={workload}
					tableValueLabel="Tasks assigned"
					footnote="A task with several assignees is counted once for each of them."
					className="lg:col-span-2"
				>
					{workload.length > 0 ? (
						<RankedBarChart data={workload} seriesLabel="Tasks assigned" />
					) : (
						<p className="text-sm text-secondary py-8 text-center">
							No tasks have been assigned to anyone yet.
						</p>
					)}
				</ChartCard>
			</div>
		</div>
	);
}
