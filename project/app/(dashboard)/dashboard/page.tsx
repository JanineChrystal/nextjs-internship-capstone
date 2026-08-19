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
 * A server component that reads the DAL directly, matching /team and /projects.
 *
 * There is no client-side fetch and no loading spinner for the numbers, because
 * there is nothing interactive about them: the page is rendered once, on the
 * server, with the figures already in the HTML. Fetching them from the browser
 * instead would mean shipping the query, waiting for a round-trip after paint,
 * and showing four empty boxes in the meantime.
 */
export default async function DashboardPage() {
	const user = await requireUser();

	// Both reads are independent, so they run together rather than one after the
	// other. The project list feeds the two Quick Actions that have to ask which
	// project they apply to.
	const [overview, projects, roles] = await Promise.all([
		getDashboardOverviewDAL(),
		getAllUserProjectsDAL(),
		getEffectiveProjectRolesDAL(),
	]);

	// Narrowed to what the picker renders. Sending the full rows would ship every
	// project's description, dates and counts to draw a list of names.
	//
	// The role is resolved in one batched read rather than per project, and is
	// what lets the picker grey out a project the action would be refused on. The
	// server still re-checks when the action runs - this only moves the answer
	// forward so nobody fills in a form to be told no afterwards.
	const pickerProjects: ProjectPickerOption[] = projects.flatMap((project) => {
		const roleAccess = roles.get(project.id);
		// A project with no resolved role should not be reachable here at all,
		// since both reads use the same three access routes. Dropping it rather
		// than defaulting to a role keeps a future divergence from silently
		// granting something.
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
