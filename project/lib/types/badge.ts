/**
 * icon name - union of allowed status and priority badge icons to ensure
 * compile-time safety and prevent config maps from naming unsupported icons
 * that would silently fail to render.
 */
export type IconName =
	| "clock"
	| "check-circle"
	| "circle"
	| "alert-triangle"
	| "chevrons-up"
	| "chevron-up"
	| "chevron-down";
