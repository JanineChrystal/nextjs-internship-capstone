import { SkeletonList, SkeletonPage } from "@/components/ui/skeletons";

/** loading state - streamed during /notifications fetches to display a list skeleton. */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<SkeletonList rememberAs="notifications" />
		</SkeletonPage>
	);
}
