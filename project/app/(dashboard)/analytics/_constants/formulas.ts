import {
	TREND_WINDOW_DAYS,
	VELOCITY_WINDOW_DAYS,
} from "@/lib/constants/analytics";

export interface FormulaNote {
	metric: string;
	formula: string;
	reasoning: string;
}

/**
 * The definition of every figure on this page, rendered on the page itself.
 *
 * A metric with no stated formula is not a metric, it is a number - two readers
 * will interpret "efficiency" differently and both will be sure they are right.
 * Writing the arithmetic down next to the result is also what makes the choices
 * below arguable rather than arbitrary, which is the point: each one traded
 * something away, and the trade is stated.
 */
export const ANALYTICS_FORMULAS: FormulaNote[] = [
	{
		metric: "Project Velocity",
		formula: `tasks completed in the last ${VELOCITY_WINDOW_DAYS} days ÷ ${VELOCITY_WINDOW_DAYS / 7} weeks`,
		reasoning:
			`Measured over ${VELOCITY_WINDOW_DAYS} days and then divided down, rather than simply counting the last 7. ` +
			"A single week is very noisy for a small team - one holiday sends the headline figure to zero and it reads as a collapse rather than as a quiet week.",
	},
	{
		metric: "Team Efficiency",
		formula: "completed tasks ÷ total tasks × 100",
		reasoning:
			"A completion rate over every task you can reach, not a productivity score. " +
			"It deliberately has no time window: a backlog that never gets closed should keep dragging this number down, which is exactly the signal it exists to give.",
	},
	{
		metric: "Active People",
		formula: `distinct people with at least one activity entry in the last ${TREND_WINDOW_DAYS} days`,
		reasoning:
			"Counts people who did something, not people who have an account. " +
			"Counting members instead would produce a number that never changes from one week to the next, which tells the reader nothing.",
	},
	{
		metric: "Avg. Task Time",
		formula: "mean of (completed at − created at), in days",
		reasoning:
			"Completion time is read from the activity log rather than from the task's updatedAt column, because updatedAt moves every time anyone renames the task or edits a note - " +
			"a task finished in March but retitled today would otherwise report a cycle time of zero days.",
	},
	{
		metric: "Project Progress",
		formula:
			"completed tasks in the project ÷ total tasks in the project × 100",
		reasoning:
			"Projects with no tasks at all are left out rather than drawn as 0%, since an empty bar reads as 'behind schedule' when it actually means 'not started'.",
	},
	{
		metric: "Completed tasks per day",
		formula: `one bucket per day across the last ${TREND_WINDOW_DAYS} days, zero-filled first`,
		reasoning:
			"The window is built before the data is folded in, so days where nothing happened still appear. " +
			"Building the axis from the data instead would place two points a fortnight apart side by side and make them read as consecutive days.",
	},
];
