"use client";

import { BarChart3 } from "lucide-react";
import { ChartCard, DonutChart, StackedBarChart } from "@/components/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { StackedGroupDTO } from "@/lib/dtos/analytics-dto";
import type { StackedDatum } from "@/lib/types/chart";
import {
	TASK_STATUS_SERIES,
	toPriorityLabel,
	toStatusTableRows,
} from "../../../../_constants/analytics";
import { useProjectAnalytics } from "../../../_hooks/use-project-analytics";

interface ChartsViewProps {
	projectId: string;
}

/**
 * DTO adapter - transforms backend data groups into the standardized format
 * expected by the chart components, allowing multiple chart panels to reuse
 * the same implementation.
 */
function toStackedData(
	groups: StackedGroupDTO[],
	toLabel: (name: string) => string = (name) => name,
): StackedDatum[] {
	return groups.map((group) => ({
		label: toLabel(group.name),
		segments: group.segments,
	}));
}

function ChartsSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{["status", "priority", "bucket"].map((key) => (
					<Skeleton key={key} className="h-96 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-96 rounded-xl" />
		</div>
	);
}

/**
 * charts view - renders four distinct analytic panels (Status, Priority,
 * Bucket, Members) by passing different grouped datasets into shared, reusable
 * chart components.
 */
export function ChartsView({ projectId }: ChartsViewProps) {
	const { analytics, isLoading } = useProjectAnalytics(projectId);

	if (isLoading) return <ChartsSkeleton />;

	if (!analytics || analytics.totalTasks === 0) {
		return (
			<EmptyState
				icon={BarChart3}
				title="Nothing to chart yet"
				description="Add a few tasks to this project and its charts will fill in."
			/>
		);
	}

	const statusRows = TASK_STATUS_SERIES.map((series) => ({
		label: series.label,
		value:
			analytics.statusTotals[series.key as keyof typeof analytics.statusTotals],
	})).filter((row) => row.value > 0);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<ChartCard
					title="Status"
					description="Every task in this project, by state."
					tableRows={statusRows}
					tableValueLabel="Tasks"
				>
					<DonutChart
						values={analytics.statusTotals}
						series={TASK_STATUS_SERIES}
						centerValue={analytics.tasksLeft}
						centerLabel={analytics.tasksLeft === 1 ? "Task left" : "Tasks left"}
					/>
				</ChartCard>

				<ChartCard
					title="Priority"
					description="Most urgent first."
					tableRows={toStatusTableRows(
						analytics.byPriority.map((group) => ({
							name: toPriorityLabel(group.name),
							total: group.total,
						})),
					)}
					tableValueLabel="Tasks"
				>
					<StackedBarChart
						data={toStackedData(analytics.byPriority, toPriorityLabel)}
						series={TASK_STATUS_SERIES}
					/>
				</ChartCard>

				<ChartCard
					title="Bucket"
					description="Tasks by board column, in board order."
					tableRows={toStatusTableRows(analytics.byBucket)}
					tableValueLabel="Tasks"
				>
					<StackedBarChart
						data={toStackedData(analytics.byBucket)}
						series={TASK_STATUS_SERIES}
					/>
				</ChartCard>
			</div>

			<ChartCard
				title="Members"
				description="Who is carrying what, with unassigned work last."
				tableRows={toStatusTableRows(analytics.byMember)}
				tableValueLabel="Tasks"
				footnote="A task with several assignees is counted once for each of them, so these columns can add up to more than the project's task count."
			>
				<StackedBarChart
					data={toStackedData(analytics.byMember)}
					series={TASK_STATUS_SERIES}
					className="**:data-[slot=chart]:h-72"
				/>
			</ChartCard>
		</div>
	);
}
