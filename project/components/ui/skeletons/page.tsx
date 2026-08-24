import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * page header skeleton - mimics the `PageHeader` component, scaling
 * its height across breakpoints to match the real typography perfectly
 * and prevent layout shifts.
 */
export function SkeletonPageHeader({
	withAction = false,
	className,
}: {
	/** header action slots - reserves layout space for right-aligned header buttons. */
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
 * page layout skeleton - centralizes the main dashboard layout constraints
 * (max-width, padding, gap) to ensure the skeleton container perfectly
 * matches the loaded state, preventing horizontal layout shifts.
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
	/** static count - the fixed number of stat tiles expected, avoiding dynamic cache lookups. */
	count?: number;
	className?: string;
}

/**
 * stat grid skeleton - renders placeholders for the top stat cards. Uses a
 * deterministic count rather than `useSkeletonCount` since stat rows are
 * always defined by fixed page constants.
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

/** chart card skeleton - simulates a standard panel containing a title, description, and chart area. */
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
