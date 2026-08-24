"use client";

import { useEffect, useState } from "react";
import {
	SKELETON_DEFAULT_COUNTS,
	SKELETON_MAX_COUNT,
	SKELETON_STORAGE_KEY,
} from "@/lib/constants/skeleton";
import type { SkeletonCountKey } from "@/lib/types/skeleton";

/**
 * How many items a surface held the last time this browser saw it.
 *
 * ## The problem this solves, and why it cannot be solved directly
 *
 * A skeleton is drawn *before* the data exists - that is the entire reason it
 * exists. At the moment it renders, nothing in the app knows how many projects
 * are about to arrive, so "show one placeholder per real card" is not something
 * that can be computed. It can only be *remembered*.
 *
 * So the count is recorded when the real list renders, and read back the next
 * time the skeleton does. Someone with three projects sees three placeholders;
 * when they add a fourth, the next load draws four. The one case it cannot get
 * right is a browser that has never seen the page, which falls back to
 * `SKELETON_DEFAULT_COUNTS`.
 *
 * ## Why it starts on the fallback and corrects in an effect
 *
 * `localStorage` does not exist on the server, and reading it during the first
 * client render would produce different markup from the server's and trip a
 * hydration mismatch. Both renders therefore start on the fallback and the
 * effect corrects it immediately after mount - before paint in practice, since
 * there is no network round trip in between.
 */
function readCounts(): Partial<Record<SkeletonCountKey, number>> {
	try {
		const raw = window.localStorage.getItem(SKELETON_STORAGE_KEY);
		if (!raw) return {};

		const parsed: unknown = JSON.parse(raw);
		/** type guard - prevents user-modified devtools values from crashing the page by ensuring stored counts are actual numbers. */
		if (typeof parsed !== "object" || parsed === null) return {};

		return parsed as Partial<Record<SkeletonCountKey, number>>;
	} catch {
		/** error fallback - safely swallows storage errors (like private browsing) since the default counts are a perfectly fine fallback. */
		return {};
	}
}

function clampCount(value: unknown, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(SKELETON_MAX_COUNT, Math.max(1, Math.round(value)));
}

/**
 * The placeholder count for one surface.
 *
 * `override` wins whenever it is given. That is the case where the count is not
 * a guess at all - a list being refetched while the previous one is still in a
 * store knows exactly how many rows it had a moment ago.
 */
export function useSkeletonCount(
	key: SkeletonCountKey,
	override?: number,
): number {
	const fallback = SKELETON_DEFAULT_COUNTS[key];
	const [remembered, setRemembered] = useState(fallback);

	useEffect(() => {
		setRemembered(clampCount(readCounts()[key], fallback));
	}, [key, fallback]);

	if (override !== undefined) return clampCount(override, fallback);
	return remembered;
}

/**
 * Records how many items a surface actually rendered.
 *
 * Call this from the component that has the real list. It is the other half of
 * `useSkeletonCount` - without it every skeleton in the app stays on its
 * default forever, and the remembering does nothing.
 *
 * A count of zero is deliberately not stored. An empty list shows an empty
 * state, not a skeleton, so remembering "zero" would mean the next load drew no
 * placeholders at all and the page looked broken while it waited.
 */
export function useRecordSkeletonCount(
	key: SkeletonCountKey,
	count: number,
): void {
	useEffect(() => {
		if (count <= 0) return;

		try {
			const next = {
				...readCounts(),
				[key]: Math.min(count, SKELETON_MAX_COUNT),
			};
			window.localStorage.setItem(SKELETON_STORAGE_KEY, JSON.stringify(next));
		} catch {
			/** write fallback - ignores quota/storage errors since falling back to default counts is acceptable. */
		}
	}, [key, count]);
}
