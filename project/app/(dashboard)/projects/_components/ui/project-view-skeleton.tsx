import { Skeleton } from "@/components/ui/skeleton";
import {
	SkeletonBoard,
	SkeletonChartCard,
	SkeletonTable,
} from "@/components/ui/skeletons";
import type { ProjectViewType } from "@/lib/types/project";

/**
 * project view skeleton - the placeholder for whichever view is about to render.
 *
 * The route-level `loading.tsx` cannot do this job: it is replaced the moment
 * the server component resolves, but the stores those views read from are filled
 * in an effect one paint later. That gap is why the board flashed empty with
 * only an "Add Board" button on it. Switching views has the same gap, and
 * `loading.tsx` does not run for that at all, since no navigation takes place.
 */
export function ProjectViewSkeleton({ view }: { view: ProjectViewType }) {
	if (view === "board") return <SkeletonBoard />;

	if (view === "grid") {
		return (
			<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
				<SkeletonTable rememberAs="project-tasks" columns={4} />
			</div>
		);
	}

	if (view === "charts") {
		return (
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<SkeletonChartCard />
					<SkeletonChartCard />
				</div>
				<SkeletonChartCard />
			</div>
		);
	}

	if (view === "calendar") {
		return (
			<div className="flex flex-col gap-4 lg:flex-row">
				<div className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<Skeleton className="h-7 w-40" />
						<div className="flex gap-2">
							<Skeleton className="size-9 rounded-md" />
							<Skeleton className="size-9 rounded-md" />
							<Skeleton className="h-9 w-40 rounded-lg" />
						</div>
					</div>
					{/* month grid - six rows of seven, the shape react-big-calendar always draws */}
					<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: 42 }, (_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
							<Skeleton key={index} className="h-14 rounded sm:h-20" />
						))}
					</div>
				</div>
				<div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:w-80 lg:shrink-0">
					<Skeleton className="h-5 w-44" />
					<SkeletonTable rememberAs="calendar-deadlines" columns={1} />
				</div>
			</div>
		);
	}

	// settings - a stack of bordered cards, which is what every section there is
	return (
		<div className="flex flex-col gap-6">
			{Array.from({ length: 3 }, (_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
					key={index}
					className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-4 sm:p-6"
				>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-3 w-72 max-w-full" />
					</div>
					<Skeleton className="h-10 w-full rounded-lg" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			))}
		</div>
	);
}
