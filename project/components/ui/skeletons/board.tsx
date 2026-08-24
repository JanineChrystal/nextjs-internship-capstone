import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonBoardProps {
	/** column count - boards are configured per project, so three is a neutral guess rather than a remembered value. */
	columns?: number;
	cardsPerColumn?: number;
	className?: string;
}

/**
 * kanban board skeleton - a row of columns, matching the real board's
 * horizontal layout at every width.
 *
 * It scrolls sideways for the same reason the board does: drawing the
 * placeholder as a vertical stack on a phone and then replacing it with a
 * horizontal row is a layout shift the reader watches happen.
 */
export function SkeletonBoard({
	columns = 3,
	cardsPerColumn = 3,
	className,
}: SkeletonBoardProps) {
	return (
		<div
			className={cn(
				"flex flex-row gap-gutter overflow-x-auto pb-4 hide-scrollbar",
				className,
			)}
		>
			{Array.from({ length: columns }, (_, columnIndex) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
					key={columnIndex}
					className="flex w-[85vw] shrink-0 flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:w-80"
				>
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Skeleton className="size-2 rounded-full" />
							<Skeleton className="h-4 w-24" />
						</div>
						<Skeleton className="size-5 rounded" />
					</div>

					{Array.from({ length: cardsPerColumn }, (_, cardIndex) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
							key={cardIndex}
							className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface p-4"
						>
							<div className="flex items-start justify-between">
								<Skeleton className="size-4 rounded" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
							<div className="mt-2 flex items-center justify-between border-t border-outline-variant/50 pt-3">
								<Skeleton className="size-6 rounded-full" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}

					<Skeleton className="mt-2 h-9 w-full rounded-lg" />
				</div>
			))}
		</div>
	);
}
