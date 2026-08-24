"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
	/** known row count - explicitly sets the number of rows, bypassing the remembered skeleton count hook. */
	rows?: number;
	/** cache key - identifies which stored row count to retrieve for smooth transitions. */
	rememberAs?: SkeletonCountKey;
	/** trailing columns - sets the number of fixed-width columns appearing after the primary flexible column. */
	columns?: number;
	/** header toggle - renders a visually distinct top row representing table headers. */
	withHeader?: boolean;
	className?: string;
}

/**
 * table skeleton - simulates a standard table layout with a flexible primary
 * column and fixed trailing columns, aligning with the actual proportions
 * of most in-app tables to prevent jarring reflows.
 */
export function SkeletonTable({
	rows,
	rememberAs = "project-tasks",
	columns = 3,
	withHeader = true,
	className,
}: SkeletonTableProps) {
	const resolved = useSkeletonCount(rememberAs, rows);
	const trailing = Math.max(1, columns);

	return (
		<div className={cn("flex w-full flex-col gap-3", className)}>
			{withHeader && (
				<div className="flex items-center gap-4 border-b border-border pb-3">
					<Skeleton className="h-3 w-24 flex-1" />
					{Array.from({ length: trailing }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
						<Skeleton key={index} className="h-3 w-20 shrink-0" />
					))}
				</div>
			)}

			{Array.from({ length: resolved }, (_, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
				<div className="flex items-center gap-4" key={rowIndex}>
					<Skeleton className="h-4 flex-1" />
					{Array.from({ length: trailing }, (_, columnIndex) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
							key={columnIndex}
							className={cn(
								"h-4 shrink-0",
								/** staggered column widths - alternates placeholder lengths to visually distinguish separate fields. */
								columnIndex % 2 === 0 ? "w-24" : "w-20",
							)}
						/>
					))}
				</div>
			))}
		</div>
	);
}
