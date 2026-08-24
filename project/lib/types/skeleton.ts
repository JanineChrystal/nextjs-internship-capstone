/**
 * skeleton count key - storage keys for surfaces whose item count should
 * persist between visits, defined as a closed union to prevent silent typos
 * causing fallback defaults.
 */
export type SkeletonCountKey =
	| "projects"
	| "project-tasks"
	| "team-members"
	| "notifications"
	| "archive-items"
	| "calendar-deadlines";
