/**
 * data visualization palette - centralizes color policy via CSS custom
 * properties, enforcing fixed slot assignments to maintain series identity and
 * strict ordering for color-vision deficiency contrast between adjacent hues.
 */

/** categorical series - provides distinct hues used to identify unrelated items, such as task statuses. */
export const CATEGORICAL_SERIES = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
] as const;

/**
 * ordinal ramp - supplies a sequential color ramp for ordered scales like
 * priority, visually reinforcing magnitude instead of categorical difference.
 */
export const ORDINAL_RAMP = [
	"var(--chart-ramp-1)",
	"var(--chart-ramp-2)",
	"var(--chart-ramp-3)",
	"var(--chart-ramp-4)",
] as const;

/** primary series - the default color used for single-series charts that don't require distinction. */
export const PRIMARY_SERIES = CATEGORICAL_SERIES[0];

export const CHART_GRID = "var(--chart-grid)";
export const CHART_AXIS = "var(--chart-axis)";

/**
 * chart surface - the background color applied as a stroke to visually
 * separate adjacent segments, preventing similarly colored fills from bleeding
 * together.
 */
export const CHART_SURFACE = "var(--card)";

/**
 * series color selection - resolves a slot index to a palette color,
 * saturating at the final slot rather than wrapping to prevent identical
 * colors for distinct series.
 */
export function seriesColor(
	index: number,
	palette: readonly string[] = CATEGORICAL_SERIES,
): string {
	return palette[Math.min(index, palette.length - 1)];
}
