import type { SkeletonCountKey } from "@/lib/types/skeleton";

/** skeleton storage key - defines the local storage key used to persist remembered item counts. */
export const SKELETON_STORAGE_KEY = "skeleton-counts";

/**
 * skeleton default counts - provides baseline placeholder counts
 * designed to slightly under-fill screens, preventing jarring UI
 * shrinkage when real data finally loads.
 */
export const SKELETON_DEFAULT_COUNTS: Record<SkeletonCountKey, number> = {
	projects: 6,
	"project-tasks": 8,
	"team-members": 6,
	notifications: 8,
	"archive-items": 5,
	"calendar-deadlines": 4,
};

/**
 * skeleton max count - caps the maximum number of rendered placeholders
 * to prevent severe performance degradation from excessive pulsing
 * animations on accounts with massive datasets.
 */
export const SKELETON_MAX_COUNT = 24;
