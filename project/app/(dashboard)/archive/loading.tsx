import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList, SkeletonPage } from "@/components/ui/skeletons";

/** Streamed while /archive fetches. The two pills stand in for its tabs. */
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
