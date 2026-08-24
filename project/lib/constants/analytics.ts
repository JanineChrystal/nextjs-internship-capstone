/**
 * analytics measurement windows - centralizes the timeframes used
 * for analytics calculations so the UI can accurately label data
 * without drifting out of sync with the underlying queries.
 */

/**
 * velocity window days - sets a 28-day window for velocity and mean
 * cycle time to balance stability against recent team performance
 * trends.
 */
export const VELOCITY_WINDOW_DAYS = 28;

/**
 * trend window days - sets a 14-day window for the completion trend
 * chart to ensure weekly rhythms can be visualized and compared over
 * two cycles.
 */
export const TREND_WINDOW_DAYS = 14;

/** recent projects limit - defines the maximum number of items in the dashboard's recent projects panel. */
export const RECENT_PROJECTS_LIMIT = 5;

/**
 * status chart order - defines a fixed order for task statuses in
 * charts to ensure consistent coloring and positioning, even when a
 * status has no data.
 */
export const STATUS_CHART_ORDER = [
	"Not Started",
	"In Progress",
	"Completed",
	"Overdue",
] as const;

/** priority chart order - explicitly orders priority levels from low to urgent for correct charting. */
export const PRIORITY_CHART_ORDER = [
	"low",
	"medium",
	"high",
	"urgent",
] as const;

/**
 * priority column order - explicitly orders priority levels from
 * urgent to low for the project charts tab, ensuring critical work
 * appears first on the left.
 */
export const PRIORITY_COLUMN_ORDER = [
	"urgent",
	"high",
	"medium",
	"low",
] as const;
