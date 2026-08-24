/**
 * trash retention days - centralizes the 30-day retention period for
 * trashed items to ensure consistency between the UI countdown and
 * the backend deletion sweep.
 */
export const TRASH_RETENTION_DAYS = 30;

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * days until purge - calculates the remaining whole days before an
 * item is purged, deliberately rounding up so the UI countdown remains
 * accurate and user-friendly.
 */
export function daysUntilPurge(deletedAt: Date): number {
	const elapsedDays =
		(Date.now() - new Date(deletedAt).getTime()) / MILLISECONDS_PER_DAY;
	return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}

/**
 * purge cutoff date - calculates the exact date below which trashed
 * items are considered expired and ready for deletion.
 */
export function toPurgeCutoff(now: Date = new Date()): Date {
	return new Date(now.getTime() - TRASH_RETENTION_DAYS * MILLISECONDS_PER_DAY);
}
