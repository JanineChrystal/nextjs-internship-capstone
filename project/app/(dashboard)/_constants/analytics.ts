import {
	BarChart3,
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

/** Icons for the project Charts tab, which has its own four tiles. */
export const PROJECT_CHART_ICONS = {
	total: ListTodo,
	completed: CheckCircle2,
	overdue: Clock,
	progress: BarChart3,
} as const;
