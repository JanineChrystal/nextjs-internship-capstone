"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import {
	CATEGORICAL_SERIES,
	CHART_SURFACE,
	seriesColor,
} from "@/components/charts/palette";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";
import { toPercentage } from "@/lib/utils/analytics";

interface ShareBarChartProps {
	data: ChartDatum[];
	/** Names one unit of the total, e.g. "tasks". Used by the legend line. */
	unitLabel: string;
	className?: string;
}

/**
 * Part-to-whole: how one total splits across a handful of named parts.
 *
 * A single stacked bar rather than a pie or donut. The comparison a reader makes
 * here is between segment lengths, and length along one shared line is the
 * easiest visual comparison there is; comparing the angles of pie slices is
 * measurably the hardest. A stacked bar also degrades gracefully - it still
 * works when one slice is 2% of the total, where a pie leaves a sliver with
 * nowhere to put its label.
 *
 * The legend below is not decoration: with the segments too small to hold text,
 * it is where the numbers actually live, so identity never rests on colour alone.
 */
export function ShareBarChart({
	data,
	unitLabel,
	className,
}: ShareBarChartProps) {
	const total = data.reduce((sum, slice) => sum + slice.value, 0);

	// Recharts stacks one <Bar> per key, so the list of slices has to be pivoted
	// into a single row whose keys are the slice names.
	const row: Record<string, number | string> = { name: "total" };
	for (const slice of data) row[slice.label] = slice.value;

	const config = Object.fromEntries(
		data.map((slice, index) => [
			slice.label,
			{ label: slice.label, color: seriesColor(index, CATEGORICAL_SERIES) },
		]),
	) satisfies ChartConfig;

	if (total === 0) {
		return (
			<p className="text-sm text-secondary py-8 text-center">
				Nothing to chart yet.
			</p>
		);
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<ChartContainer config={config} className="aspect-auto h-14 w-full">
				<BarChart
					accessibilityLayer
					data={[row]}
					layout="vertical"
					margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
				>
					<XAxis type="number" hide domain={[0, total]} />
					<YAxis type="category" dataKey="name" hide />

					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent indicator="dot" />}
					/>

					{data.map((slice, index) => (
						<Bar
							key={slice.label}
							dataKey={slice.label}
							stackId="share"
							fill={seriesColor(index, CATEGORICAL_SERIES)}
							// A 2px stroke in the surface colour is what separates one
							// segment from the next. Without it, two neighbouring segments
							// of similar lightness merge into one longer segment - the most
							// common way a stacked bar quietly misleads.
							stroke={CHART_SURFACE}
							strokeWidth={2}
							radius={4}
						/>
					))}
				</BarChart>
			</ChartContainer>

			<ul className="flex flex-wrap gap-x-5 gap-y-2">
				{data.map((slice, index) => (
					<li key={slice.label} className="flex items-center gap-2">
						<span
							className="h-2.5 w-2.5 rounded-sm shrink-0"
							style={{
								backgroundColor: seriesColor(index, CATEGORICAL_SERIES),
							}}
							aria-hidden="true"
						/>
						{/* The label and both figures are plain text in the normal ink
						    colour - never tinted to match the swatch. Coloured text at
						    12px is the fastest way to fail contrast. */}
						<span className="text-xs text-secondary">
							<span className="text-on-surface font-medium">{slice.label}</span>{" "}
							<span className="tabular-nums">
								{slice.value} {unitLabel}
							</span>{" "}
							<span className="tabular-nums">
								({toPercentage(slice.value, total)}%)
							</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
