import {
	SkeletonChartCard,
	SkeletonPage,
	SkeletonStatGrid,
} from "@/components/ui/skeletons";

/**
 * Streamed while /dashboard fetches.
 *
 * Four stat tiles as a literal, not a remembered count: they come from
 * `DASHBOARD_STAT_CARDS`, which is a constant, so the number is known rather
 * than guessed at. Remembering something already knowable would be machinery
 * that can only go wrong.
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
