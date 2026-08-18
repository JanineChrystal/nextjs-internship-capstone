/**
 * How long a trashed item is kept before it is destroyed for good.
 *
 * Thirty days is the figure the UI counts down from, so it lives here rather
 * than in either the sweep or the countdown - two copies of a retention period
 * is how a product ends up promising thirty days and deleting at seven.
 */
export const TRASH_RETENTION_DAYS = 30;

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days left before an item is purged, floored at zero.
 *
 * Rounded up, deliberately: something deleted four hours ago has "30 days left",
 * not 29. Rounding down would show a countdown that ticks the moment you look
 * away, which reads as the item being closer to gone than it is.
 */
export function daysUntilPurge(deletedAt: Date): number {
	const elapsedDays =
		(Date.now() - new Date(deletedAt).getTime()) / MILLISECONDS_PER_DAY;
	return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}

/** The cutoff a sweep deletes below: anything trashed before this is expired. */
export function toPurgeCutoff(now: Date = new Date()): Date {
	return new Date(now.getTime() - TRASH_RETENTION_DAYS * MILLISECONDS_PER_DAY);
}
