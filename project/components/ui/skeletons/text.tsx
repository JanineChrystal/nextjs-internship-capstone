import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The width of each line, cycled.
 *
 * Uniform full-width bars read as a table, not as prose. Real paragraphs end
 * short, so the last line of each group is - which is the cheapest thing that
 * makes a block of grey rectangles read as text.
 */
const LINE_WIDTHS = ["w-full", "w-full", "w-3/4"];

interface SkeletonTextProps {
	/** How many lines to draw. */
	lines?: number;
	className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
	return (
		<div className={cn("flex w-full flex-col gap-2", className)}>
			{Array.from({ length: lines }, (_, index) => (
				<Skeleton
					// A skeleton list has no identity to key by - the items are
					// indistinguishable, never reordered, and never re-keyed against real
					// data, so the index is genuinely stable here.
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
					key={index}
					className={cn("h-4", LINE_WIDTHS[index % LINE_WIDTHS.length])}
				/>
			))}
		</div>
	);
}
