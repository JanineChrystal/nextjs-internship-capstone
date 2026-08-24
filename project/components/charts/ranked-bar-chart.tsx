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

/** dynamic chart height - ensures adequate vertical spacing per row so charts don't compress. */
function toChartHeight(rowCount: number): number {
	return Math.max(160, rowCount * 34 + 24);
}

/**
 * ranked bar chart - compares magnitude across named entities using horizontal
 * bars to preserve legible, unrotated labels. Employs a single uniform hue,
 * relying on bar length and sorting to communicate rank.
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
					/** asymmetrical rounding - rounds only the growing end of the bar to maintain visual anchoring at the baseline. */
					radius={[0, 4, 4, 0]}
					barSize={16}
				>
					{/*
					  * direct value labels - displays values statically next to bars
					  * to ensure readability when color contrast against the background
					  * might fail.
					  */}
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
