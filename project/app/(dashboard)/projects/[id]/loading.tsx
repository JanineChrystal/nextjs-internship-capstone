import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage, SkeletonTable } from "@/components/ui/skeletons";

/** The project detail view tabs, keyed by name rather than by index. */
const VIEW_TABS = ["board", "grid", "calendar", "charts", "settings"];

/**
 * Streamed while a project detail page fetches.
 *
 * The pill row stands in for the view tabs, which render before the project
 * data does - reserving their height is what stops the content below sliding
 * down as the rest arrives.
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
