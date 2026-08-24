import { SkeletonPage, SkeletonTable } from "@/components/ui/skeletons";

/** team loading - displays a skeleton table while fetching, scaling its row count based on historical data. */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
				<SkeletonTable rememberAs="team-members" columns={3} />
			</div>
		</SkeletonPage>
	);
}
