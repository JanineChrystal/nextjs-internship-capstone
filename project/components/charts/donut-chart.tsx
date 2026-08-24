"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import { CHART_SURFACE } from "@/components/charts/palette";
import { ChartLegend } from "@/components/charts/stacked-bar-chart";
import type { ChartSeries } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface DonutChartProps {
	/** slice values - keyed by series key to ensure slices always map to their assigned series color. */
	values: Record<string, number>;
	series: ChartSeries[];
	/** center figure - the primary headline value displayed in the center of the ring. */
	centerValue: number | string;
	centerLabel: string;
	className?: string;
}

/**
 * donut chart - renders a ring with a central headline figure, prioritizing
 * the unified display of a total and its breakdown over the easier visual
 * comparison of lengths (like a bar chart). Mitigates the difficulty of
 * angle comparison by always providing explicit textual counts.
 */
export function DonutChart({
	values,
	series,
	centerValue,
	centerLabel,
	className,
}: DonutChartProps) {
	const slices = series
		.map((entry) => ({
			key: entry.key,
			label: entry.label,
			color: entry.color,
			value: values[entry.key] ?? 0,
		}))
		/** drop empty statuses - filters out zero-value slices to avoid cluttering the legend and tooltip targets. */
		.filter((slice) => slice.value > 0);

	const config = Object.fromEntries(
		slices.map((slice) => [
			slice.key,
			{ label: slice.label, color: slice.color },
		]),
	) satisfies ChartConfig;

	if (slices.length === 0) {
		return (
			<p className="text-sm text-secondary py-10 text-center">
				No tasks in this project yet.
			</p>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<ChartContainer config={config} className="aspect-auto h-64 w-full">
				<PieChart>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent nameKey="label" hideLabel />}
					/>

					<Pie
						data={slices}
						dataKey="value"
						nameKey="label"
						innerRadius="62%"
						outerRadius="86%"
						/** visual separation - introduces a gap between segments so adjacent arcs are clearly distinct. */
						paddingAngle={slices.length > 1 ? 2 : 0}
						stroke={CHART_SURFACE}
						strokeWidth={2}
					>
						{slices.map((slice) => (
							<Cell key={slice.key} fill={slice.color} />
						))}

						<Label
							content={({ viewBox }) => {
								if (!viewBox || !("cx" in viewBox)) return null;
								const { cx, cy } = viewBox;

								return (
									<text x={cx} y={cy} textAnchor="middle">
										<tspan
											x={cx}
											dy="-0.2em"
											className="fill-on-surface text-3xl font-semibold"
										>
											{centerValue}
										</tspan>
										<tspan x={cx} dy="1.6em" className="fill-secondary text-xs">
											{centerLabel}
										</tspan>
									</text>
								);
							}}
						/>
					</Pie>
				</PieChart>
			</ChartContainer>

			<ChartLegend
				series={slices.map((slice) => ({
					key: slice.key,
					label: `${slice.label} (${slice.value})`,
					color: slice.color,
				}))}
			/>
		</div>
	);
}
