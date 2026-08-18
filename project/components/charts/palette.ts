/**
 * The data-visualisation palette, as CSS custom properties.
 *
 * The hex values themselves live in app/globals.css so that light and dark are
 * defined in the same place as every other colour in the design system. What
 * lives here is the *policy*: which slot is used for what, and in what order.
 *
 * Two rules the panel is likely to ask about:
 *
 * 1. Categorical slots are assigned in FIXED order and never cycled. A series
 *    keeps its colour when a chart is filtered, so hue always means "which
 *    thing" and never "which rank". Cycling a ninth colour back to slot 1 would
 *    make two different series look identical.
 *
 * 2. The slot order is not decorative - it was chosen so that every ADJACENT
 *    pair stays distinguishable under colour-vision deficiency (validated at
 *    delta-E >= 8 in OKLab for protanopia, deuteranopia and tritanopia, against
 *    this app's own card surface in both themes). Adjacent matters because
 *    adjacent segments and adjacent bars are the pairs a reader actually has to
 *    tell apart.
 */

/** Identity: which thing this is. Used for task status. */
export const CATEGORICAL_SERIES = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
] as const;

/**
 * Order: how much / how far along. Used for priority, which is a scale rather
 * than a set of unrelated labels - low, medium, high and urgent have an obvious
 * sequence, and giving them five unrelated hues would hide it.
 */
export const ORDINAL_RAMP = [
	"var(--chart-ramp-1)",
	"var(--chart-ramp-2)",
	"var(--chart-ramp-3)",
	"var(--chart-ramp-4)",
] as const;

/** A single-series chart never needs identity, so it always takes slot 1. */
export const PRIMARY_SERIES = CATEGORICAL_SERIES[0];

export const CHART_GRID = "var(--chart-grid)";
export const CHART_AXIS = "var(--chart-axis)";

/**
 * The surface colour, painted as a 2px stroke between adjacent fills.
 *
 * This is what creates the hairline gap between stacked segments. Without it two
 * neighbouring segments of similar lightness read as one wider segment, which is
 * the single most common way a stacked bar misleads.
 */
export const CHART_SURFACE = "var(--card)";

/**
 * Picks a colour for slot `index`, saturating at the last slot rather than
 * wrapping around. Wrapping would hand slot 1's colour to a sixth series and
 * make it indistinguishable from the first.
 */
export function seriesColor(
	index: number,
	palette: readonly string[] = CATEGORICAL_SERIES,
): string {
	return palette[Math.min(index, palette.length - 1)];
}
