/**
 * The surfaces whose item count is worth remembering between visits.
 *
 * A closed union rather than a free string. These names are storage keys - a
 * typo would not fail, it would silently start a second, empty entry and the
 * skeleton would quietly fall back to its default forever. The compiler catches
 * that; nothing at runtime would.
 */
export type SkeletonCountKey =
	| "projects"
	| "project-tasks"
	| "team-members"
	| "notifications"
	| "archive-items"
	| "calendar-deadlines";
