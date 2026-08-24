import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList, SkeletonPage } from "@/components/ui/skeletons";

/**
 * loading state - streamed during /archive fetches, displaying two pill
 * skeletons to represent the tabs.
 */
export default function Loading() {
	return (
		<SkeletonPage>
			<div className="flex gap-2">
				<Skeleton className="h-9 w-28 rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
			<SkeletonList rememberAs="archive-items" />
		</SkeletonPage>
	);
}
