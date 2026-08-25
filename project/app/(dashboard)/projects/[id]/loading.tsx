import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonBoard, SkeletonPage } from "@/components/ui/skeletons";

/** view tabs - keyed by name rather than index for stable identification. */
const VIEW_TABS = ["board", "grid", "calendar", "charts", "settings"];

/**
 * loading state - streamed during project detail fetches.
 *
 * It draws a **board**, not a table. The view is component state that resets to
 * "board" on every mount, so the page always opens on the board no matter which
 * tab was last used - and the skeleton was showing a grid, which meant the
 * placeholder never once matched what arrived after it.
 */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<div className="flex flex-wrap gap-2">
				{VIEW_TABS.map((view) => (
					<Skeleton key={view} className="h-9 w-24 rounded-lg" />
				))}
			</div>

			<SkeletonBoard />
		</SkeletonPage>
	);
}
