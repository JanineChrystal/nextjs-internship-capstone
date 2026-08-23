"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";
import type { SkeletonCountKey } from "@/lib/types/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
	/** An exact row count when the caller knows one. Wins over `rememberAs`. */
	rows?: number;
	/** Which surface's remembered count to use when `rows` is not given. */
	rememberAs?: SkeletonCountKey;
	/** Columns after the flexible first one. */
	columns?: number;
	/** Draws a heavier header row above the body. */
	withHeader?: boolean;
	className?: string;
}

/**
 * A grid or table placeholder.
 *
 * The first column flexes and the rest are fixed, which is what almost every
 * table in this app does: a name that takes the space left over, then status,
 * assignee and date columns of roughly known width. A row of equal columns
 * would be simpler and would not resemble the thing it stands in for.
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
								// Varied so the columns read as different fields rather than as
								// one block of grey ruled into stripes.
								columnIndex % 2 === 0 ? "w-24" : "w-20",
							)}
						/>
					))}
				</div>
			))}
		</div>
	);
}
