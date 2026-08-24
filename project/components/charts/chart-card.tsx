import type React from "react";
import { BaseCard } from "@/components/ui/cards/base-card";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface ChartCardProps {
	title: string;
	description?: string;
	/**
	 * table fallback - provides a vital accessibility alternative to the chart
	 * for screen readers and contrast-impaired users, rendered from the exact
	 * same data to guarantee consistency.
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
				/**
				 * suppress hover lift - disables the default hover scale effect on
				 * charts to prevent the surface from shifting while a user is
				 * targeting a tooltip.
				 */
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
										{/* tabular numbers - ensures the column of figures perfectly aligns. */}
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
