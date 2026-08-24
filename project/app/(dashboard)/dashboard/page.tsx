import type { Metadata } from "next";
import { ChartCard, TrendAreaChart } from "@/components/charts";
import { TREND_WINDOW_DAYS } from "@/lib/constants/analytics";
import { getDashboardOverviewDAL } from "@/lib/dal/analytics";
import { requireUser } from "@/lib/dal/auth";
import { getEffectiveProjectRolesDAL } from "@/lib/dal/permissions";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import type { ProjectPickerOption } from "@/lib/types/dashboard";
import { StatCard } from "../_components/ui/cards/stat-card";
import { PageHeader } from "../_components/ui/headers/page-header";
import { DASHBOARD_STAT_CARDS } from "../_constants/analytics";
import { QuickActionsPanel } from "./_components/quick-actions-panel";
import { RecentProjectsPanel } from "./_components/recent-projects-panel";

export const metadata: Metadata = {
	title: "Dashboard",
};

/**
 * dashboard page - a server component that renders the dashboard via
 * direct DAL queries, omitting client-side fetches and spinners to deliver
 * a fully populated document on initial load.
 */
export default async function DashboardPage() {
	const user = await requireUser();

	// parallel data fetch - executes independent DAL queries concurrently, feeding necessary project context into Quick Actions.
	const [overview, projects, roles] = await Promise.all([
		getDashboardOverviewDAL(),
		getAllUserProjectsDAL(),
		getEffectiveProjectRolesDAL(),
	]);

	// picker payload optimization - narrows the project dataset down to essential fields and resolves roles upfront to disable unauthorized actions in the UI before submission.
	const pickerProjects: ProjectPickerOption[] = projects.flatMap((project) => {
		const roleAccess = roles.get(project.id);
		// role validation drop - drops projects lacking a resolved role instead of providing a fallback, preventing accidental unauthorized access.
		if (!roleAccess) return [];

		return [
			{
				id: project.id,
				name: project.name,
				category: project.category,
				isOwned: project.ownerId === user.id,
				roleAccess,
			},
		];
	});

	const trend = overview.completionTrend.map((day) => ({
		label: day.label,
		value: day.tasksCompleted,
	}));

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			<PageHeader
				title={`Welcome back${user.firstName ? `, ${user.firstName}` : ""}`}
				description="Everything below covers every project you can reach - the ones you own and the ones you were invited into."
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{DASHBOARD_STAT_CARDS.map((card) => (
					<StatCard
						key={card.id}
						label={card.label}
						value={overview[card.id]}
						unit={card.unit}
						icon={card.icon}
						hint={card.hint}
					/>
				))}
			</div>

			<ChartCard
				title="Completed tasks"
				description={`How much has actually shipped over the last ${TREND_WINDOW_DAYS} days.`}
				tableRows={trend}
				tableValueLabel="Tasks completed"
				footnote="Counted from the activity log, so a task edited today does not count as completed today."
			>
				<TrendAreaChart data={trend} seriesLabel="Tasks completed" />
			</ChartCard>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<RecentProjectsPanel projects={overview.recentProjects} />
				<QuickActionsPanel projects={pickerProjects} />
			</div>
		</div>
	);
}
