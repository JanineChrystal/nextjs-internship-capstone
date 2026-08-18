/**
 * The shapes every chart in components/charts consumes.
 *
 * Deliberately generic. A chart component that knew about tasks or projects
 * could only ever be used for tasks or projects; taking {label, value} means the
 * same bar chart draws project progress, member workload, or anything added
 * later, and the caller does the one-line mapping. That is dependency inversion
 * in its plainest form - the low-level component defines the contract and the
 * feature code conforms to it, rather than the component reaching upward into
 * the feature's DTOs.
 */
export interface ChartDatum {
	label: string;
	value: number;
}

/**
 * One column of a stacked chart: a category, and how its total splits.
 *
 * `segments` is keyed by series key rather than being a fixed set of fields, so
 * the same component draws "tasks by priority, split by status" and "tasks by
 * assignee, split by status" without knowing what a status is.
 */
export interface StackedDatum {
	label: string;
	segments: Record<string, number>;
}

/**
 * One series in a multi-series chart: its data key, what to call it, and the
 * colour it always wears.
 *
 * Colour lives on the series rather than being chosen at render time, which is
 * what guarantees a series keeps its colour when a filter removes another one.
 * If colour were assigned by position, hiding "Completed" would repaint every
 * remaining series and the reader would have to re-learn the legend.
 */
export interface ChartSeries {
	key: string;
	label: string;
	color: string;
}
