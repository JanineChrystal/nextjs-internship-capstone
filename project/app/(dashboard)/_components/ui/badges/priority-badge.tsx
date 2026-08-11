import {
	AlertTriangle,
	ChevronDown,
	ChevronsUp,
	ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";
import {
	type IconName,
	PRIORITY_CONFIG,
} from "../../../projects/_constants/badges";

interface PriorityBadgeProps {
	priority: TaskPriority;
	className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
	const { color, icon } = PRIORITY_CONFIG[priority];

	const IconMap: Record<IconName, React.ElementType> = {
		"alert-triangle": AlertTriangle,
		"chevrons-up": ChevronsUp,
		"chevron-up": ChevronUp,
		"chevron-down": ChevronDown,
		clock: AlertTriangle,
		"check-circle": AlertTriangle,
		circle: AlertTriangle,
	};

	const Icon = IconMap[icon];

	return (
		<div
			className={cn(
				"inline-flex items-center text-sm font-medium whitespace-nowrap",
				color,
				className,
			)}
		>
			<Icon className="w-4 h-4 mr-1.5" />
			{priority}
		</div>
	);
}
