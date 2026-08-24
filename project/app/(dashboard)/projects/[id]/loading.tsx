import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage, SkeletonTable } from "@/components/ui/skeletons";

/** view tabs - keyed by name rather than index for stable identification. */
const VIEW_TABS = ["board", "grid", "calendar", "charts", "settings"];

/**
 * loading state - streamed during project detail fetches, prioritizing the
 * view tabs pill row to reserve height and prevent layout shift as the rest
 * of the page arrives.
 */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<div className="flex flex-wrap gap-2">
				{VIEW_TABS.map((view) => (
					<Skeleton key={view} className="h-9 w-24 rounded-lg" />
				))}
			</div>

			<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
				<SkeletonTable rememberAs="project-tasks" columns={4} />
			</div>
		</SkeletonPage>
	);
}
