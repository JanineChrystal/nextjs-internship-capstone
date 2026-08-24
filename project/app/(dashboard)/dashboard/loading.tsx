import {
	SkeletonChartCard,
	SkeletonPage,
	SkeletonStatGrid,
} from "@/components/ui/skeletons";

/**
 * loading state - streamed during /dashboard fetches, utilizing constant
 * values for stat card skeletons instead of needlessly guessing or storing
 * row counts.
 */
export default function Loading() {
	return (
		<SkeletonPage>
			<SkeletonStatGrid count={4} />
			<SkeletonChartCard />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<SkeletonChartCard />
				<SkeletonChartCard />
			</div>
		</SkeletonPage>
	);
}
