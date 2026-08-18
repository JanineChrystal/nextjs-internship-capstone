"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import {
	CHART_AXIS,
	CHART_GRID,
	PRIMARY_SERIES,
} from "@/components/charts/palette";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface TrendAreaChartProps {
	data: ChartDatum[];
	/** What one unit means, e.g. "Tasks completed". Also the tooltip's row label. */
	seriesLabel: string;
	className?: string;
}

/**
 * Change over time, for a single series.
 *
 * An area rather than a bar chart because the reader's question is "is this
 * going up or down", not "how does Tuesday compare to Thursday" - a continuous
 * shape answers the first far faster than fourteen separate bars.
 *
 * One series, so there is no legend: the card title already names what is being
 * plotted, and a legend box for a single entry is noise. Colour here carries no
 * meaning at all, which is why it simply takes slot 1 rather than choosing.
 */
export function TrendAreaChart({
	data,
	seriesLabel,
	className,
}: TrendAreaChartProps) {
	const config = {
		value: { label: seriesLabel, color: PRIMARY_SERIES },
	} satisfies ChartConfig;

	return (
		<ChartContainer
			config={config}
			className={cn("aspect-auto h-56 w-full", className)}
		>
			<AreaChart
				data={data}
				margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
			>
				<defs>
					{/* The fill fades out downward so the line stays the loudest part of
					    the mark - a solid block of colour would out-shout the trend it
					    is meant to support. */}
					<linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={PRIMARY_SERIES} stopOpacity={0.28} />
						<stop offset="100%" stopColor={PRIMARY_SERIES} stopOpacity={0.02} />
					</linearGradient>
				</defs>

				{/* Horizontal rules only. Vertical ones add no information here - the
				    x-axis is already labelled - and they compete with the data. */}
				<CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />

				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={{ stroke: CHART_AXIS }}
					tickMargin={8}
					// Every other tick, so a fortnight of labels never collides on a
					// narrow screen.
					interval="preserveStartEnd"
					minTickGap={24}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					width={44}
					// Task counts are whole things; a "2.5 tasks" gridline is a lie.
					allowDecimals={false}
				/>

				<ChartTooltip
					cursor={{ stroke: CHART_AXIS, strokeWidth: 1 }}
					content={<ChartTooltipContent indicator="line" />}
				/>

				<Area
					dataKey="value"
					name={seriesLabel}
					type="monotone"
					stroke={PRIMARY_SERIES}
					strokeWidth={2}
					fill="url(#trend-area-fill)"
					// Markers appear on hover only: a dot on all fourteen points turns
					// the line into a dotted mess, but the reader still needs a target.
					dot={false}
					activeDot={{ r: 4, strokeWidth: 2 }}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
