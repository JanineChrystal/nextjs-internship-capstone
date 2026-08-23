import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonAvatarProps {
	/** Drops the name and subtitle, leaving the circle alone. */
	nameless?: boolean;
	className?: string;
}

/** One avatar, with the name and subtitle that usually sit beside it. */
export function SkeletonAvatar({ nameless, className }: SkeletonAvatarProps) {
	return (
		<div className={cn("flex w-fit items-center gap-4", className)}>
			<Skeleton className="size-10 shrink-0 rounded-full" />
			{!nameless && (
				<div className="grid gap-2">
					<Skeleton className="h-4 w-37.5" />
					<Skeleton className="h-4 w-25" />
				</div>
			)}
		</div>
	);
}

interface SkeletonAvatarListProps {
	count: number;
	className?: string;
}

/** A column of avatar rows - a member directory, an assignee list. */
export function SkeletonAvatarList({
	count,
	className,
}: SkeletonAvatarListProps) {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{Array.from({ length: count }, (_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no id
				<SkeletonAvatar key={index} className="w-full" />
			))}
		</div>
	);
}
