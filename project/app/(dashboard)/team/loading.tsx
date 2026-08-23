import { SkeletonPage, SkeletonTable } from "@/components/ui/skeletons";

/** Streamed while /team fetches. The row count is remembered per browser. */
export default function Loading() {
	return (
		<SkeletonPage withAction>
			<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
				<SkeletonTable rememberAs="team-members" columns={3} />
			</div>
		</SkeletonPage>
	);
}
