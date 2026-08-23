import type { SkeletonCountKey } from "@/lib/types/skeleton";

/** Where the remembered counts live. One entry, a JSON map of key to count. */
export const SKELETON_STORAGE_KEY = "skeleton-counts";

/**
 * What to draw before this browser has ever seen the real thing.
 *
 * Chosen to slightly *under*-fill a first screen rather than over-fill it. A
 * skeleton that is shorter than the content it becomes makes the page grow,
 * which reads as loading; one that is longer makes the page shrink and jump,
 * which reads as something being taken away.
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
 * The most placeholders any skeleton will draw, however many were last seen.
 *
 * Someone with four hundred tasks would otherwise get four hundred pulsing
 * blocks on every load - hundreds of animated elements, which is slower to
 * paint than the content it is standing in for, and which is not a more honest
 * preview than a screenful. A screen is all anyone can see before the real data
 * arrives anyway.
 */
export const SKELETON_MAX_COUNT = 24;
