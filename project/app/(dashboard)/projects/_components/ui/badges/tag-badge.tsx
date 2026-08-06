import { cn } from "@/lib/utils";
import type { TaskTag } from "@/types/task";
import { TAG_CONFIG } from "../../../_constants/badges";

interface TagBadgeProps {
	tag: TaskTag;
	className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
	const colorClass = TAG_CONFIG[tag];

	return (
		<div
			className={cn(
				"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
				colorClass,
				className,
			)}
		>
			{tag}
		</div>
	);
}
