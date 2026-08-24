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
 * trend area chart - visualizes change over time for a single series, utilizing
 * a continuous area to rapidly communicate overall direction. Omits a legend
 * and defaults to slot 1 color as the series is already established by context.
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
					{/* fading fill - applies a downward gradient so the trendline itself remains the most prominent visual element. */}
					<linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={PRIMARY_SERIES} stopOpacity={0.28} />
						<stop offset="100%" stopColor={PRIMARY_SERIES} stopOpacity={0.02} />
					</linearGradient>
				</defs>

				{/* horizontal gridlines - limits grids to horizontal to avoid cluttering the already-labeled time axis. */}
				<CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />

				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={{ stroke: CHART_AXIS }}
					tickMargin={8}
					/** space x-axis labels - forces gaps between tick labels to prevent crowding on small viewports. */
					interval="preserveStartEnd"
					minTickGap={24}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					width={44}
					/** force integer ticks - prevents fractional Y-axis labels for indivisible items. */
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
					/** interactive markers - hides data dots by default to maintain line clarity, showing them only on hover. */
					dot={false}
					activeDot={{ r: 4, strokeWidth: 2 }}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
