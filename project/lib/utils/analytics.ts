import type { DailyCountDTO } from "@/lib/dtos/analytics-dto";

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

/**
 * Every metric on the analytics surfaces is one of the five functions below.
 *
 * They live in lib/utils rather than in the DAL on purpose: none of them touch
 * the database or the session, so each one can be reasoned about - and tested -
 * by reading a single pair of arguments. The DAL's job is to fetch rows; turning
 * rows into a number is a separate job with a separate reason to change.
 */

/**
 * A share of a whole, as a whole-number percentage.
 *
 * Returns 0 rather than NaN for an empty whole. A project with no tasks is 0%
 * complete, not "undefined" - and NaN would render as literal "NaN%" in the UI
 * and poison every average it is folded into.
 */
export function toPercentage(part: number, whole: number): number {
	if (whole <= 0) return 0;
	return Math.round((part / whole) * 100);
}

/**
 * Throughput, expressed as tasks completed per week.
 *
 *     velocity = completionsInWindow / (windowDays / 7)
 *
 * Measured over a multi-week window and then divided down, rather than simply
 * counting the last seven days. A single week is extremely noisy for a small
 * team - one holiday drops the headline number to zero and it reads as a
 * collapse in productivity rather than as a quiet week. A 28-day window divided
 * by four still answers "tasks per week" but averages that noise away.
 */
export function toVelocityPerWeek(
	completionsInWindow: number,
	windowDays: number,
): number {
	if (windowDays <= 0) return 0;
	const weeks = windowDays / DAYS_PER_WEEK;
	return Math.round((completionsInWindow / weeks) * 10) / 10;
}

/**
 * Mean cycle time in days: how long a task takes from creation to completion.
 *
 *     avgTaskTime = sum(completedAt - createdAt) / numberOfCompletedTasks
 *
 * Negative spans are dropped rather than clamped to zero. A negative value means
 * the completion timestamp predates the task itself, which is corrupt data, and
 * folding a zero into the mean would quietly drag the average down instead of
 * leaving the sample out.
 */
export function toAverageDays(durationsMs: number[]): number {
	const valid = durationsMs.filter((ms) => ms >= 0);
	if (valid.length === 0) return 0;

	const totalDays = valid.reduce(
		(sum, ms) => sum + ms / MILLISECONDS_PER_DAY,
		0,
	);
	return Math.round((totalDays / valid.length) * 10) / 10;
}

/**
 * The local calendar day a timestamp falls on, as a sortable key.
 *
 * Built from local year/month/day rather than toISOString(), which is UTC: in
 * Manila (UTC+8) everything before 8am belongs to the previous UTC day, so ISO
 * keys would file this morning's completions under yesterday.
 */
function toLocalDayKey(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Counts timestamps into one bucket per day across a fixed trailing window.
 *
 * The window is built FIRST, zero-filled, and only then are the timestamps
 * folded in. Building it from the data instead would silently drop quiet days,
 * and a line chart whose x-axis skips the days where nothing happened is a chart
 * that lies: two points a fortnight apart would be drawn side by side and read
 * as consecutive.
 */
export function countPerDay(
	timestamps: Date[],
	windowDays: number,
	now: Date = new Date(),
): DailyCountDTO[] {
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);

	const buckets = new Map<string, DailyCountDTO>();

	for (let offset = windowDays - 1; offset >= 0; offset--) {
		const day = new Date(today.getTime() - offset * MILLISECONDS_PER_DAY);
		buckets.set(toLocalDayKey(day), {
			date: toLocalDayKey(day),
			label: day.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			}),
			tasksCompleted: 0,
		});
	}

	for (const timestamp of timestamps) {
		const bucket = buckets.get(toLocalDayKey(new Date(timestamp)));
		// Anything outside the window is ignored rather than clamped into the
		// nearest edge bucket, which would pile months of history onto day one.
		if (bucket) bucket.tasksCompleted += 1;
	}

	return Array.from(buckets.values());
}

/**
 * Tallies a list of values into {name, value} pairs, in a caller-supplied order.
 *
 * The order argument is what keeps a chart's colours stable: without it the
 * segments would be ordered by whatever the database returned, so a status that
 * happened to have no tasks today would shift every other segment's colour.
 */
export function tallyBy<T>(
	items: T[],
	toKey: (item: T) => string,
	preferredOrder: readonly string[] = [],
): { name: string; value: number }[] {
	const counts = new Map<string, number>();
	for (const key of preferredOrder) counts.set(key, 0);

	for (const item of items) {
		const key = toKey(item);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return (
		Array.from(counts.entries())
			// A preferred key with no members is dropped from the chart, but only
			// after the tally - it still had to reserve its position above.
			.filter(([, value]) => value > 0)
			.map(([name, value]) => ({ name, value }))
	);
}
