import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/ui/skeletons";

/**
 * Streamed while /settings fetches.
 *
 * Three cards in a single full-width column, matching the page since the
 * in-page menu was removed. The first is much taller than the others because
 * the Clerk account panel is the heaviest thing on the page by a wide margin,
 * and it is also code-split - so this height is what stops the two sections
 * below it jumping upward while it arrives.
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
