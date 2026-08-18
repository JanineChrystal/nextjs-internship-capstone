"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import { CHART_AXIS, PRIMARY_SERIES } from "@/components/charts/palette";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface RankedBarChartProps {
	data: ChartDatum[];
	seriesLabel: string;
	/** Appended to the direct label, e.g. "%". */
	unit?: string;
	/** Fixes the axis, so 40% draws as 40% of the width rather than filling it. */
	domainMax?: number;
	className?: string;
}

/** Roughly 28px per row plus the axis, so ten rows do not squash into a strip. */
function toChartHeight(rowCount: number): number {
	return Math.max(160, rowCount * 34 + 24);
}

/**
 * Comparing magnitude across named things - project progress, per-member workload.
 *
 * Horizontal rather than vertical, because the category names here are project
 * and people names. Vertical bars would force those labels to rotate 45 degrees,
 * and rotated text is measurably slower to read; laid on its side, each label
 * gets a full line of its own.
 *
 * One hue for every bar. The bars are already sorted, so length carries the
 * ranking; giving each bar its own colour would imply the colours meant
 * something and leave the reader hunting for a legend that explains nothing.
 */
export function RankedBarChart({
	data,
	seriesLabel,
	unit = "",
	domainMax,
	className,
}: RankedBarChartProps) {
	const config = {
		value: { label: seriesLabel, color: PRIMARY_SERIES },
	} satisfies ChartConfig;

	return (
		<ChartContainer
			config={config}
			className={cn("aspect-auto w-full", className)}
			style={{ height: toChartHeight(data.length) }}
		>
			<BarChart
				accessibilityLayer
				data={data}
				layout="vertical"
				margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
			>
				<XAxis
					type="number"
					hide
					domain={domainMax ? [0, domainMax] : undefined}
				/>
				<YAxis
					type="category"
					dataKey="label"
					tickLine={false}
					axisLine={{ stroke: CHART_AXIS }}
					width={120}
					tickMargin={8}
				/>

				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>

				<Bar
					dataKey="value"
					name={seriesLabel}
					fill={PRIMARY_SERIES}
					// Rounded only on the growing end. Rounding the baseline end too
					// would detach the bar from its axis and make short bars look like
					// floating pills rather than measurements from zero.
					radius={[0, 4, 4, 0]}
					barSize={16}
				>
					{/* Direct labels, not a value on hover only. Three of the palette's
					    light-mode steps sit below 3:1 against a white card, and the rule
					    for that is simple: if colour alone cannot carry it, print the
					    number. */}
					<LabelList
						dataKey="value"
						position="right"
						offset={8}
						className="fill-on-surface text-xs tabular-nums"
						formatter={(value: unknown) => `${value ?? 0}${unit}`}
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}
