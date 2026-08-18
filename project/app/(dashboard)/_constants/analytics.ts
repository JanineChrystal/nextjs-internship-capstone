import {
	CheckCircle2,
	Clock,
	FolderOpen,
	Gauge,
	ListTodo,
	TrendingUp,
	Users,
} from "lucide-react";
import {
	TREND_WINDOW_DAYS,
	VELOCITY_WINDOW_DAYS,
} from "@/lib/constants/analytics";
import type {
	AnalyticsMetricsDTO,
	DashboardOverviewDTO,
} from "@/lib/dtos/analytics-dto";
import type { StatCardConfig } from "@/lib/types/analytics";
import type { ChartSeries } from "@/lib/types/chart";

/**
 * Every stat tile on the dashboard and analytics pages is described here rather
 * than written inline in the page.
 *
 * Two reasons. The first is the house rule that config maps live in _constants.
 * The second is more interesting: the `hint` on each tile states the formula
 * behind the number, and stating it next to the number is the only way it stays
 * true. A tile that says "8.5 tasks/week" with no definition invites four
 * different readings, and the day someone changes the window from four weeks to
 * one, the label has to change with it - which it will, because both the label
 * and the window are imported from the same place.
 */

export const DASHBOARD_STAT_CARDS: StatCardConfig<DashboardOverviewDTO>[] = [
	{
		id: "activeProjects",
		label: "Active Projects",
		icon: FolderOpen,
		hint: "Projects you can reach whose status is still active.",
	},
	{
		id: "teamMembers",
		label: "Team Members",
		icon: Users,
		hint: "Distinct people across those projects, owners included.",
	},
	{
		id: "completedTasks",
		label: "Completed Tasks",
		icon: CheckCircle2,
		hint: "Tasks marked complete, all time.",
	},
	{
		id: "pendingTasks",
		label: "Pending Tasks",
		icon: ListTodo,
		hint: "Total tasks minus completed tasks.",
	},
];

export const ANALYTICS_STAT_CARDS: StatCardConfig<AnalyticsMetricsDTO>[] = [
	{
		id: "projectVelocity",
		label: "Project Velocity",
		unit: "tasks/week",
		icon: TrendingUp,
		hint: `Tasks completed in the last ${VELOCITY_WINDOW_DAYS} days, divided by ${VELOCITY_WINDOW_DAYS / 7} weeks.`,
	},
	{
		id: "teamEfficiency",
		label: "Team Efficiency",
		unit: "% complete",
		icon: Gauge,
		hint: "Completed tasks divided by total tasks.",
	},
	{
		id: "activeUsers",
		label: "Active People",
		unit: `last ${TREND_WINDOW_DAYS} days`,
		icon: Users,
		hint: "Distinct people who recorded any activity in the window.",
	},
	{
		id: "avgTaskTime",
		label: "Avg. Task Time",
		unit: "days",
		icon: Clock,
		hint: "Mean days from a task being created to being completed.",
	},
];

/** Priority is stored lowercase; charts and legends need it capitalised. */
export const PRIORITY_LABELS: Record<string, string> = {
	low: "Low",
	medium: "Medium",
	high: "High",
	urgent: "Urgent",
};

export function toPriorityLabel(priority: string): string {
	return PRIORITY_LABELS[priority] ?? priority;
}

/**
 * The four status series every chart on the project Charts tab shares.
 *
 * The ORDER of this array is a correctness constraint, not a style choice. It is
 * the order segments stack in and the order the legend reads, and it was picked
 * so that no two ADJACENT colours are confusable - adjacent is what matters,
 * because adjacent segments are the pairs a reader actually has to separate.
 *
 * The one thing it deliberately avoids is red touching green. "Late" beside
 * "Completed" is the most consequential pair on the chart and the classic
 * red-green confusion, so Overdue sits second and In Progress separates it from
 * Completed. Completed is also aqua rather than pure green, which roughly
 * doubles its separation from red under deuteranopia.
 *
 * The colours come from CSS custom properties so light and dark are defined
 * beside every other colour in the design system, and both sets were validated
 * against this app's own card surface.
 */
export const TASK_STATUS_SERIES: ChartSeries[] = [
	{
		key: "notStarted",
		label: "Not Started",
		color: "var(--chart-status-not-started)",
	},
	{
		key: "overdue",
		label: "Overdue",
		color: "var(--chart-status-overdue)",
	},
	{
		key: "inProgress",
		label: "In Progress",
		color: "var(--chart-status-in-progress)",
	},
	{
		key: "completed",
		label: "Completed",
		color: "var(--chart-status-completed)",
	},
];

/** Turns a stacked group into the {label, value} rows ChartCard's table wants. */
export function toStatusTableRows(
	groups: { name: string; total: number }[],
): { label: string; value: number }[] {
	return groups.map((group) => ({ label: group.name, value: group.total }));
}
