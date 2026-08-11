import { cn } from "@/lib/utils";
import type { TaskTag } from "@/types/task";
import {
	getDynamicBadgeColor,
	TAG_CONFIG,
} from "../../../projects/_constants/badges";

interface TagBadgeProps {
	tag: TaskTag | string;
	className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
	const colorClass = TAG_CONFIG[tag as TaskTag] || getDynamicBadgeColor(tag);

	return (
		<div
			className={cn(
				"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border",
				colorClass,
				className,
			)}
		>
			{tag}
		</div>
	);
}
