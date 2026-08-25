"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

/**
 * card skeleton - a static placeholder mirroring a project card's exact structure
 * (header, title, tags, progress footer) to avoid layout reflows on load.
 * Intentionally avoids interactive components like `BaseCard` to prevent
 * confusing hover states on loading elements.
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
	 * known grid count - forces an exact number of cards, taking precedence
	 * over the cached amount when the current count is explicitly known.
	 */
	count?: number;
	/** cache key - identifies which stored count to use for smooth, jitter-free transitions. */
	rememberAs?: SkeletonCountKey;
	/** grid styling - defines the grid layout classes, falling back to a standard three-column view. */
	className?: string;
}

/**
 * card grid skeleton - renders a grid of card placeholders based on the
 * historically remembered count to prevent the grid from collapsing and expanding
 * between page navigations.
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
