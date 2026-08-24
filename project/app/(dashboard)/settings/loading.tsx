import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/ui/skeletons";

/**
 * settings loading skeleton - renders a full-width, three-card placeholder
 * layout while the page fetches, specifically allocating extra height for the
 * first card to prevent layout shift when the heavy Clerk component loads.
 */
export default function Loading() {
	return (
		<SkeletonPage>
			<div className="flex flex-col gap-6">
				<Skeleton className="h-128 w-full rounded-xl" />
				<Skeleton className="h-80 w-full rounded-xl" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		</SkeletonPage>
	);
}
