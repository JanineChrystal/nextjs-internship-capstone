import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage, SkeletonText } from "@/components/ui/skeletons";

/** loading state - streamed during profile fetches. */
export default function Loading() {
	return (
		<SkeletonPage>
			<div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
				<Skeleton className="size-24 shrink-0 rounded-full" />
				<div className="flex w-full flex-col gap-3">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 max-w-full" />
					<SkeletonText lines={2} className="max-w-md" />
				</div>
			</div>
		</SkeletonPage>
	);
}
