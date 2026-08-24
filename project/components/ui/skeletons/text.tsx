import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * text line widths - cycles widths so the skeleton resembles a natural
 * jagged-edged paragraph rather than a squared-off table.
 */
const LINE_WIDTHS = ["w-full", "w-full", "w-3/4"];

interface SkeletonTextProps {
	/** line count - total number of skeleton bars to render. */
	lines?: number;
	className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
	return (
		<div className={cn("flex w-full flex-col gap-2", className)}>
			{Array.from({ length: lines }, (_, index) => (
				<Skeleton
					/** static list rendering - utilizes array index as key since the skeleton lines are immutable and purely decorative. */
					key={index}
					className={cn("h-4", LINE_WIDTHS[index % LINE_WIDTHS.length])}
				/>
			))}
		</div>
	);
}
