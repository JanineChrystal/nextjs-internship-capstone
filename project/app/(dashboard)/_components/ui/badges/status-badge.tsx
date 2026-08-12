import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/task";
import {
	type IconName,
	STATUS_CONFIG,
} from "../../../projects/_constants/badges";

interface StatusBadgeProps {
	status: TaskStatus | string;
	className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = STATUS_CONFIG[status];
	if (!config) return null;

	const { color, icon } = config;

	const IconMap: Record<IconName, React.ElementType> = {
		clock: Clock,
		"check-circle": CheckCircle2,
		circle: Circle,
		"alert-triangle": Clock,
		"chevrons-up": Clock,
		"chevron-up": Clock,
		"chevron-down": Clock,
	};

	const Icon = IconMap[icon];

	return (
		<div
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap",
				color,
				className,
			)}
		>
			<Icon className="w-3.5 h-3.5 mr-1.5" />
			{status}
		</div>
	);
}
