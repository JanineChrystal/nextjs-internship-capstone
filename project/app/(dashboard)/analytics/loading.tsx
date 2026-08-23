import {
	SkeletonChartCard,
	SkeletonPage,
	SkeletonStatGrid,
} from "@/components/ui/skeletons";

/** Streamed while /analytics fetches. Four tiles, from `ANALYTICS_STAT_CARDS`. */
export default function Loading() {
	return (
		<SkeletonPage>
			<SkeletonStatGrid count={4} />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<SkeletonChartCard className="lg:col-span-2" />
				<SkeletonChartCard />
				<SkeletonChartCard />
			</div>
		</SkeletonPage>
	);
}
