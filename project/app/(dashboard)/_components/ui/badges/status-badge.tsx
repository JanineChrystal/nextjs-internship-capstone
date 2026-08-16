import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
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
	if (!status) return null;

	// Unknown values still render with neutral styling rather than vanishing -
	// statuses are user-facing text and must never silently disappear.
	const { color, icon } = STATUS_CONFIG[status] ?? {
		color: "text-secondary bg-surface-container-high border-outline-variant/30",
		icon: "circle" as IconName,
	};

	const IconMap: Record<IconName, React.ElementType> = {
		clock: Clock,
		"check-circle": CheckCircle2,
		circle: Circle,
		"alert-triangle": AlertTriangle,
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
