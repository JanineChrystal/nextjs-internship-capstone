/**
 * The icons a status or priority badge is allowed to show.
 *
 * A union rather than `string` so a config map cannot name an icon the badge has
 * no case for - that would render nothing at all, silently.
 */
export type IconName =
	| "clock"
	| "check-circle"
	| "circle"
	| "alert-triangle"
	| "chevrons-up"
	| "chevron-up"
	| "chevron-down";
