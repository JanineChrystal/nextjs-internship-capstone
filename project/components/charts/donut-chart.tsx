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
	/** Keyed by series key, so a slice always wears its series' colour. */
	values: Record<string, number>;
	series: ChartSeries[];
	/** The figure printed in the hole. */
	centerValue: number | string;
	centerLabel: string;
	className?: string;
}

/**
 * A ring, with a headline figure in the middle.
 *
 * Worth being straight about the trade-off, because it is the one chart here
 * that is not the textbook choice: comparing the ANGLES of arcs is the hardest
 * visual comparison there is, and a stacked bar would let a reader compare
 * lengths along one line instead. What the ring buys is the hole - it is the
 * only form that puts a single large number and its breakdown in the same
 * object, which is exactly the reading this panel is for ("how many are left,
 * and what state is everything in").
 *
 * The mitigation for the weak comparison is the legend below and the table
 * inside ChartCard: the precise counts are always available as text, so nobody
 * has to estimate an angle to get a number.
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
		// An empty status is dropped rather than drawn as a zero-width arc, which
		// would still occupy a legend row and a tooltip target for nothing.
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
						// Segments are separated by a gap rather than only by hue, so two
						// adjacent arcs can never read as one longer arc.
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
