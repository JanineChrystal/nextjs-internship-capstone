"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

/**
 * One card-shaped placeholder.
 *
 * Built from `Skeleton` blocks inside a plain bordered box rather than from
 * `BaseCard`. `BaseCard` carries a hover lift and a shadow, which on something
 * that is not interactive and is about to be replaced reads as the page
 * reacting to a pointer that has nothing to press.
 *
 * The internal proportions match the real project card - a status row, a title,
 * two description lines, two tags, then a footer with a progress bar - because
 * a skeleton whose shape does not match what replaces it produces a visible
 * reflow at exactly the moment the reader starts reading.
 */
export function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<Skeleton className="size-2.5 rounded-full" />
				<Skeleton className="h-4 w-16" />
			</div>

			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>

			<div className="flex gap-2">
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>

			<div className="mt-auto flex flex-col gap-3 pt-4">
				<div className="flex justify-between">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-2 w-full rounded-full" />
			</div>
		</div>
	);
}

interface SkeletonCardGridProps {
	/**
	 * An exact count, when the caller knows one - a list being refetched while
	 * the previous one is still in a store, for instance. Wins over `rememberAs`.
	 */
	count?: number;
	/** Which surface's remembered count to use when `count` is not given. */
	rememberAs?: SkeletonCountKey;
	/** Grid template. Defaults to the three-column layout the project list uses. */
	className?: string;
}

/**
 * A grid of card placeholders, as many as the surface last held.
 *
 * See `useSkeletonCount` for why the number is remembered rather than computed:
 * a skeleton renders before the data exists, so the count can only come from
 * the last time this browser saw the real thing.
 */
export function SkeletonCardGrid({
	count,
	rememberAs = "projects",
	className,
}: SkeletonCardGridProps) {
	const resolved = useSkeletonCount(rememberAs, count);

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
		>
			{Array.from({ length: resolved }, (_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
				<SkeletonCard key={index} />
			))}
		</div>
	);
}
