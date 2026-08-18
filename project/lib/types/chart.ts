/**
 * The one shape every chart in components/charts consumes.
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
