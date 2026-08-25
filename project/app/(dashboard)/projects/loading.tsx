import { SkeletonCardGrid, SkeletonPage } from "@/components/ui/skeletons";

/**
 * loading state - streamed during /projects fetches, using the remembered
 * count from previous visits to prevent jarring visual shifts caused by
 * hard-coded placeholder counts.
 */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<SkeletonCardGrid rememberAs="projects" />
		</SkeletonPage>
	);
}
