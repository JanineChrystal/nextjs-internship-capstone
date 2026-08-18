import type React from "react";
import { BaseCard } from "@/components/ui/cards/base-card";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface ChartCardProps {
	title: string;
	description?: string;
	/**
	 * The same numbers the chart draws, offered as a table.
	 *
	 * Not optional politeness - it is the required fallback for the two cases
	 * colour cannot serve: a screen-reader user, and a reader for whom two
	 * adjacent hues sit below the 3:1 contrast line against the card. Rendering
	 * it from the identical array the chart receives is what stops the table and
	 * the picture from ever disagreeing.
	 */
	tableRows?: ChartDatum[];
	tableValueLabel?: string;
	footnote?: string;
	children: React.ReactNode;
	className?: string;
}

export function ChartCard({
	title,
	description,
	tableRows,
	tableValueLabel = "Value",
	footnote,
	children,
	className,
}: ChartCardProps) {
	return (
		<BaseCard
			className={cn(
				// BaseCard lifts on hover, which is right for a clickable card and
				// wrong for a chart: the surface would slide out from under the
				// cursor at the exact moment the reader is aiming at a tooltip.
				"hover:scale-100 gap-3",
				className,
			)}
		>
			<div>
				<h3 className="text-base font-semibold text-on-surface">{title}</h3>
				{description && (
					<p className="text-sm text-secondary mt-0.5">{description}</p>
				)}
			</div>

			{children}

			{footnote && (
				<p className="text-xs text-secondary/80 wrap-anywhere">{footnote}</p>
			)}

			{tableRows && tableRows.length > 0 && (
				<details className="text-sm">
					<summary className="cursor-pointer text-xs text-secondary hover:text-on-surface transition-colors">
						View as table
					</summary>
					<div className="mt-2 overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="border-b border-border">
									<th className="py-1.5 pr-4 text-xs font-medium text-secondary">
										{title}
									</th>
									<th className="py-1.5 text-xs font-medium text-secondary text-right">
										{tableValueLabel}
									</th>
								</tr>
							</thead>
							<tbody>
								{tableRows.map((row) => (
									<tr key={row.label} className="border-b border-border/50">
										<td className="py-1.5 pr-4 text-on-surface">{row.label}</td>
										{/* tabular-nums so the column of figures lines up */}
										<td className="py-1.5 text-right text-on-surface tabular-nums">
											{row.value}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</details>
			)}
		</BaseCard>
	);
}
