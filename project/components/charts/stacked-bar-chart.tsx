"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import {
	CHART_AXIS,
	CHART_GRID,
	CHART_SURFACE,
} from "@/components/charts/palette";
import type { ChartSeries, StackedDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface StackedBarChartProps {
	data: StackedDatum[];
	series: ChartSeries[];
	className?: string;
}

/**
 * stacked bar chart - a unified component for drawing multi-series grouped
 * columns, centralizing styling and tooltips for various panel types. Enforces
 * a shared global Y-axis to prevent misleading, disproportionate scaling
 * between categories.
 */
export function StackedBarChart({
	data,
	series,
	className,
}: StackedBarChartProps) {
	/** flatten segments for recharts - spreads nested segment values onto the root row object for Recharts ingestion. */
	const rows = data.map((datum) => ({
		label: datum.label,
		...Object.fromEntries(
			series.map((entry) => [entry.key, datum.segments[entry.key] ?? 0]),
		),
	}));

	const config = Object.fromEntries(
		series.map((entry) => [
			entry.key,
			{ label: entry.label, color: entry.color },
		]),
	) satisfies ChartConfig;

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<ChartContainer config={config} className="aspect-auto h-64 w-full">
				<BarChart
					accessibilityLayer
					data={rows}
					margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
				>
					<CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />

					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={{ stroke: CHART_AXIS }}
						tickMargin={8}
						interval={0}
						/** truncate labels - prefers ellipsis over rotation to keep long X-axis names highly readable. */
						tickFormatter={(value: string) =>
							value.length > 14 ? `${value.slice(0, 13)}…` : value
						}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={4}
						width={44}
						/** force integer ticks - disables decimal Y-axis labels since tasks are indivisible units. */
						allowDecimals={false}
					/>

					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent indicator="dot" />}
					/>

					{series.map((entry) => (
						<Bar
							key={entry.key}
							dataKey={entry.key}
							name={entry.label}
							stackId="status"
							fill={entry.color}
							/**
							 * segment separation - applies a surface-colored stroke to prevent
							 * similarly colored stacked segments from merging visually.
							 */
							stroke={CHART_SURFACE}
							strokeWidth={2}
						/>
					))}
				</BarChart>
			</ChartContainer>

			<ChartLegend series={series} />
		</div>
	);
}

/**
 * chart legend - a mandatory shared legend component providing textual labels
 * for multi-series charts, ensuring color identity is never strictly reliant
 * on potentially low-contrast swatches.
 */
export function ChartLegend({ series }: { series: ChartSeries[] }) {
	return (
		<ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
			{series.map((entry) => (
				<li key={entry.key} className="flex items-center gap-2">
					<span
						className="h-2.5 w-2.5 rounded-sm shrink-0"
						style={{ backgroundColor: entry.color }}
						aria-hidden="true"
					/>
					{/* high contrast text - forces legend labels to standard ink colors to prevent contrast failure. */}
					<span className="text-xs text-on-surface">{entry.label}</span>
				</li>
			))}
		</ul>
	);
}
