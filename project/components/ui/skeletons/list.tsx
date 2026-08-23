"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

/** One row: a leading mark, two lines of text, and a trailing meta chip. */
export function SkeletonListRow({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-lg border border-border bg-surface-container-low p-3",
				className,
			)}
		>
			<Skeleton className="mt-1 size-2.5 shrink-0 rounded-full" />
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</div>
			<Skeleton className="h-5 w-12 shrink-0 rounded-full" />
		</div>
	);
}

interface SkeletonListProps {
	/** An exact count when the caller knows one. Wins over `rememberAs`. */
	count?: number;
	rememberAs?: SkeletonCountKey;
	className?: string;
}

/**
 * A stacked list placeholder - side panels, notification feeds, activity.
 *
 * Deliberately distinct from `SkeletonTable`: a list row wraps its own border
 * and sits in a column, where a table row is ruled columns sharing one grid.
 * Using the table for a side panel produced a skeleton that turned into
 * something visibly different, which is worse than no skeleton - the reader
 * watches the layout rearrange under the content they were about to read.
 */
export function SkeletonList({
	count,
	rememberAs = "calendar-deadlines",
	className,
}: SkeletonListProps) {
	const resolved = useSkeletonCount(rememberAs, count);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{Array.from({ length: resolved }, (_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
				<SkeletonListRow key={index} />
			))}
		</div>
	);
}
