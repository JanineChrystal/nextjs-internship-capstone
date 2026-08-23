import { SkeletonCardGrid, SkeletonPage } from "@/components/ui/skeletons";

/**
 * Streamed while /projects fetches.
 *
 * The card count comes from what this browser last saw here - see
 * `hooks/use-skeleton-count.ts`. It was a hard-coded six, so someone with two
 * projects watched four placeholder cards vanish on every load.
 */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<SkeletonCardGrid rememberAs="projects" />
		</SkeletonPage>
	);
}
