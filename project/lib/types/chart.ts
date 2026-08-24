/**
 * chart datum - defines the generic shape consumed by chart components,
 * decoupling them from specific feature DTOs to enable reusability across
 * different data domains (e.g. tasks, projects) via simple mapping.
 */
export interface ChartDatum {
	label: string;
	value: number;
}

/**
 * stacked datum - represents one column in a stacked chart, using dynamic
 * series keys instead of fixed fields to support variable split categories
 * without tightly coupling to domain-specific statuses.
 */
export interface StackedDatum {
	label: string;
	segments: Record<string, number>;
}

/**
 * chart series - configures a multi-series chart entry, ensuring colors are
 * bound to the series rather than assigned by render position to maintain
 * visual consistency when other series are filtered out.
 */
export interface ChartSeries {
	key: string;
	label: string;
	color: string;
}
