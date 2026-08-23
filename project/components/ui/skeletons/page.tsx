import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The page header placeholder.
 *
 * Its proportions track `PageHeader`'s responsive type scale - `h-8` on a phone
 * against `text-2xl`, `h-12` from `xl` against `text-5xl`. A fixed-height
 * skeleton would be correct at one breakpoint and would make the page jump at
 * every other one.
 */
export function SkeletonPageHeader({
	withAction = false,
	className,
}: {
	/** Reserves space for the buttons some headers carry. */
	withAction?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6",
				className,
			)}
		>
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-56 sm:h-9 lg:h-10 xl:h-12" />
				<Skeleton className="h-4 w-full max-w-lg" />
			</div>

			{withAction && (
				<div className="flex flex-col gap-3 sm:flex-row">
					<Skeleton className="h-10 w-full rounded-md sm:w-36" />
					<Skeleton className="h-10 w-full rounded-md sm:w-32" />
				</div>
			)}
		</div>
	);
}

/**
 * The outer frame every dashboard loading state shares.
 *
 * Matches the `flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8` wrapper the
 * real pages use. Repeating that string in nine `loading.tsx` files is how the
 * skeletons end up a different width from the pages they precede - and the
 * mismatch only shows as a sideways shift at the moment content arrives, which
 * is the hardest kind of layout bug to attribute.
 */
export function SkeletonPage({
	withAction,
	children,
	className,
}: {
	withAction?: boolean;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<output
			aria-busy="true"
			aria-label="Loading"
			className={cn(
				"mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8",
				className,
			)}
		>
			<SkeletonPageHeader withAction={withAction} />
			{children}
		</output>
	);
}

interface SkeletonStatGridProps {
	/** Stat tiles are a fixed set per page, so this is a real count, not a guess. */
	count?: number;
	className?: string;
}

/**
 * The row of stat tiles above most dashboard pages.
 *
 * `count` has no remembered variant on purpose. These come from a constant -
 * `DASHBOARD_STAT_CARDS`, `ANALYTICS_STAT_CARDS` - so the caller genuinely
 * knows the number at render time and there is nothing to remember.
 */
export function SkeletonStatGrid({
	count = 4,
	className,
}: SkeletonStatGridProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
				className,
			)}
		>
			{Array.from({ length: count }, (_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
					key={index}
					className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
				>
					<div className="flex items-center justify-between">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="size-8 rounded-lg" />
					</div>
					<Skeleton className="h-8 w-16" />
					<Skeleton className="h-3 w-28" />
				</div>
			))}
		</div>
	);
}

/** A chart panel: title, subtitle, plot area. */
export function SkeletonChartCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
				className,
			)}
		>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-3 w-64 max-w-full" />
			</div>
			<Skeleton className="h-56 w-full rounded-lg" />
		</div>
	);
}
