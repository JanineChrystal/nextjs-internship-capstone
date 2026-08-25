import type { LucideIcon } from "lucide-react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string | number;
	/** measurement unit - optional suffix appended to the value text. */
	unit?: string;
	icon: LucideIcon;
	/** calculation hint - short explanation of the metric's origin or meaning. */
	hint?: string;
	className?: string;
}

/**
 * stat card component - displays a single headline metric with consistent styling
 * across all dashboard surfaces, optimizing for scannability over complex charting.
 */
export function StatCard({
	label,
	value,
	unit,
	icon: Icon,
	hint,
	className,
}: StatCardProps) {
	return (
		<BaseCard className={cn("gap-2 justify-between", className)}>
			<div className="flex items-start justify-between gap-3">
				<span className="text-sm font-medium text-secondary">{label}</span>
				<span className="h-9 w-9 shrink-0 rounded-lg bg-primary-container/15 flex items-center justify-center">
					<Icon className="h-4 w-4 text-primary" aria-hidden="true" />
				</span>
			</div>

			<div className="flex items-baseline gap-1.5">
				{/* proportional digits - uses default number spacing rather than tabular formatting for better aesthetics on standalone figures. */}
				<span className="text-3xl font-semibold text-on-surface">{value}</span>
				{unit && <span className="text-xs text-secondary">{unit}</span>}
			</div>

			{hint && <p className="text-xs text-secondary/80">{hint}</p>}
		</BaseCard>
	);
}
