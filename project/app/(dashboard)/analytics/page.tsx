import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import {
	ChartCard,
	OrdinalBarChart,
	RankedBarChart,
	ShareBarChart,
	TrendAreaChart,
} from "@/components/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { TREND_WINDOW_DAYS } from "@/lib/constants/analytics";
import { getAnalyticsDashboardDAL } from "@/lib/dal/analytics";
import { requireUser } from "@/lib/dal/auth";
import { StatCard } from "../_components/ui/cards/stat-card";
import { PageHeader } from "../_components/ui/headers/page-header";
import { ANALYTICS_STAT_CARDS, toPriorityLabel } from "../_constants/analytics";
import { FormulaNotes } from "./_components/formula-notes";

export const metadata: Metadata = {
	title: "Analytics",
};

export default async function AnalyticsPage() {
	await requireUser();
	const analytics = await getAnalyticsDashboardDAL();

	// The charts speak {label, value}; the DTOs speak in domain terms. Mapping
	// here rather than inside the chart components is what keeps those components
	// reusable for anything else that ever needs a ranked bar.
	const trend = analytics.teamActivity.map((day) => ({
		label: day.label,
		value: day.tasksCompleted,
	}));
	const progress = analytics.projectProgress.map((project) => ({
		label: project.name,
		value: project.progress,
	}));
	const statuses = analytics.statusBreakdown.map((slice) => ({
		label: slice.name,
		value: slice.value,
	}));
	const priorities = analytics.priorityBreakdown.map((slice) => ({
		label: toPriorityLabel(slice.name),
		value: slice.value,
	}));

	const hasTasks = statuses.length > 0;

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			<PageHeader
				title="Analytics"
				description="Project performance and team productivity, measured across every project you can reach."
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{ANALYTICS_STAT_CARDS.map((card) => (
					<StatCard
						key={card.id}
						label={card.label}
						value={analytics.metrics[card.id]}
						unit={card.unit}
						icon={card.icon}
						hint={card.hint}
					/>
				))}
			</div>

			{!hasTasks ? (
				<EmptyState
					icon={BarChart3}
					title="No task data yet"
					description="Create a few tasks and complete some of them - the charts fill in from there."
				/>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<ChartCard
						title="Team activity"
						description={`Tasks completed per day over the last ${TREND_WINDOW_DAYS} days.`}
						tableRows={trend}
						tableValueLabel="Tasks completed"
						className="lg:col-span-2"
					>
						<TrendAreaChart data={trend} seriesLabel="Tasks completed" />
					</ChartCard>

					<ChartCard
						title="Task status"
						description="How the whole workload splits across statuses right now."
						tableRows={statuses}
						tableValueLabel="Tasks"
						footnote="Overdue is calculated from the due date, never stored - so it can never go stale."
					>
						<ShareBarChart data={statuses} unitLabel="tasks" />
					</ChartCard>

					<ChartCard
						title="Priority distribution"
						description="Where the work sits on the priority scale."
						tableRows={priorities}
						tableValueLabel="Tasks"
					>
						<OrdinalBarChart data={priorities} seriesLabel="Tasks" />
					</ChartCard>

					<ChartCard
						title="Project progress"
						description="Percentage of tasks completed, highest first."
						tableRows={progress}
						tableValueLabel="% complete"
						className="lg:col-span-2"
					>
						{progress.length > 0 ? (
							<RankedBarChart
								data={progress}
								seriesLabel="Complete"
								unit="%"
								domainMax={100}
							/>
						) : (
							<p className="text-sm text-secondary py-8 text-center">
								No project has any tasks yet.
							</p>
						)}
					</ChartCard>
				</div>
			)}

			<FormulaNotes />
		</div>
	);
}
