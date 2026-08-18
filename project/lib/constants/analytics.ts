/**
 * The measurement windows every analytics figure is calculated over.
 *
 * They live here rather than inside the DAL because the UI has to be able to say
 * what it is showing - "tasks/week over 28 days" is part of the number's meaning,
 * and a label that drifts out of sync with the query is worse than no label.
 */

/**
 * How far back velocity and mean cycle time look.
 *
 * Four weeks: long enough that one quiet week cannot halve the headline figure,
 * short enough that it still reflects how the team works now rather than how it
 * worked last quarter.
 */
export const VELOCITY_WINDOW_DAYS = 28;

/**
 * How many days the completion-trend chart plots.
 *
 * Fourteen rather than seven so a weekly rhythm is visible twice - a single week
 * shows a shape but gives the reader nothing to compare it against.
 */
export const TREND_WINDOW_DAYS = 14;

/** How many projects the dashboard's "Recent Projects" panel lists. */
export const RECENT_PROJECTS_LIMIT = 5;

/**
 * Fixed ordering for the task-status chart. Charts read this instead of the
 * database's ordering so a status keeps its colour and its position even on a
 * day when nothing sits in it.
 */
export const STATUS_CHART_ORDER = [
	"Not Started",
	"In Progress",
	"Completed",
	"Overdue",
] as const;

/** Priority is an ordered scale, so it is charted low -> urgent, never alphabetically. */
export const PRIORITY_CHART_ORDER = [
	"low",
	"medium",
	"high",
	"urgent",
] as const;

/**
 * Priority order for the project Charts tab, most urgent first.
 *
 * Deliberately the reverse of PRIORITY_CHART_ORDER above. That one feeds an
 * ordinal colour ramp that runs light-to-dark, so its data has to run
 * low-to-urgent to match. This one feeds a plain column chart where nothing is
 * encoded by position, so the useful order is the one that puts the work
 * needing attention on the left, where reading starts.
 */
export const PRIORITY_COLUMN_ORDER = [
	"urgent",
	"high",
	"medium",
	"low",
] as const;
