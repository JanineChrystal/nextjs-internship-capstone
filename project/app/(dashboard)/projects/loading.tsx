import { Skeleton } from "@/components/ui/skeleton";

function ProjectCardSkeleton() {
	return (
		<div className="flex flex-col gap-4 h-full p-6 rounded-xl border border-outline-variant bg-surface">
			<div className="flex justify-between items-center">
				<Skeleton className="h-2.5 w-2.5 rounded-full" />
				<Skeleton className="h-4 w-16" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
			<div className="mt-auto pt-4 flex flex-col gap-3">
				<div className="flex justify-between">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-2 w-full rounded-full" />
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-32 rounded-md" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: 6 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
					<ProjectCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
