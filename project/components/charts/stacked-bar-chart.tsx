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
 * A column per category, split into stacked segments by series.
 *
 * This one component draws the Priority, Bucket and Members panels. They differ
 * only in what the x-axis is - the series, the colours, the stacking and the
 * tooltip are identical - so building three of these would have meant three
 * copies drifting apart the first time any of them was restyled.
 *
 * Every column shares one y-axis, deliberately. A per-column axis would let a
 * bucket holding two tasks draw the same height as one holding twenty, which is
 * the single fastest way to make a chart lie.
 */
export function StackedBarChart({
	data,
	series,
	className,
}: StackedBarChartProps) {
	// Recharts reads flat objects, so each column's segments are spread onto the
	// row alongside its label.
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
						// Names can be long. Truncating beats rotating: rotated text is
						// measurably slower to read, and the tooltip carries the full name.
						tickFormatter={(value: string) =>
							value.length > 14 ? `${value.slice(0, 13)}…` : value
						}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={4}
						width={44}
						// Tasks are whole things; a gridline at 2.5 tasks is a lie.
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
							// A 2px stroke in the surface colour is what puts a hairline gap
							// between one segment and the next. Without it, two adjacent
							// segments of similar lightness merge into one taller segment -
							// the most common way a stacked bar quietly misleads.
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
 * The legend, shared by every chart that has more than one series.
 *
 * Always present, never optional. With four series stacked into thin segments,
 * this is the only place the reader can learn what a colour means - and three of
 * the light-mode status colours sit below 3:1 contrast against the card, so
 * identity must not rest on the swatch alone.
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
					{/* Label text stays in the normal ink colour, never tinted to match
					    the swatch - coloured text at 12px is the quickest way to fail
					    contrast. */}
					<span className="text-xs text-on-surface">{entry.label}</span>
				</li>
			))}
		</ul>
	);
}
