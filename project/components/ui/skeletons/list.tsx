"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

/** list row skeleton - renders a single list item featuring an icon, two lines of text, and a trailing badge. */
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
	/** known item count - bypasses the cache hook to force an exact number of rows. */
	count?: number;
	rememberAs?: SkeletonCountKey;
	className?: string;
}

/**
 * list skeleton - represents a stacked column of individual bordered items
 * (e.g., sidebars, feeds). Built distinctly from tables so the structural
 * layout doesn't jar when the real cards arrive.
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
