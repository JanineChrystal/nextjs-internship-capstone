import { SkeletonList, SkeletonPage } from "@/components/ui/skeletons";

/** Streamed while /notifications fetches. */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<SkeletonList rememberAs="notifications" />
		</SkeletonPage>
	);
}
