import type { LucideIcon } from "lucide-react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string | number;
	/** The unit the value is measured in, e.g. "tasks/week". */
	unit?: string;
	icon: LucideIcon;
	/** One short line explaining how the figure is calculated. */
	hint?: string;
	className?: string;
}

/**
 * A single headline number.
 *
 * Deliberately not a chart. A lone value has no shape to plot - drawing it as a
 * one-bar bar chart adds axes, gridlines and a legend to communicate exactly one
 * number, and the number on its own is both smaller and faster to read.
 *
 * One component for all three surfaces (dashboard, analytics, a project's Charts
 * tab). The three used to be three separate hand-rolled blocks of markup, which
 * is how they ended up with three slightly different paddings.
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
				{/* tabular-nums is deliberately NOT used here: a large standalone
				    figure reads better in the font's default proportional digits, and
				    nothing below it needs to line up. */}
				<span className="text-3xl font-semibold text-on-surface">{value}</span>
				{unit && <span className="text-xs text-secondary">{unit}</span>}
			</div>

			{hint && <p className="text-xs text-secondary/80">{hint}</p>}
		</BaseCard>
	);
}
