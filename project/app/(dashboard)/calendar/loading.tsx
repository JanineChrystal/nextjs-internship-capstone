import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList, SkeletonPage } from "@/components/ui/skeletons";

/**
 * loading state - streamed during /calendar fetches, presenting a unified
 * month grid skeleton to avoid the visual noise of animating thirty-five
 * individual day cells.
 */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
				<div className="flex h-[70vh] min-h-112.5 flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-3 sm:p-6 xl:col-span-3 xl:h-187.5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<Skeleton className="h-6 w-40" />
						<div className="flex gap-2">
							<Skeleton className="size-9 rounded-md" />
							<Skeleton className="size-9 rounded-md" />
							<Skeleton className="h-9 w-44 rounded-lg" />
						</div>
					</div>
					<Skeleton className="w-full flex-1 rounded-lg" />
				</div>

				<div className="flex h-100 flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-4 sm:h-125 sm:p-6 xl:col-span-1 xl:h-187.5">
					<Skeleton className="h-5 w-40" />
					<SkeletonList rememberAs="calendar-deadlines" />
				</div>
			</div>
		</SkeletonPage>
	);
}
