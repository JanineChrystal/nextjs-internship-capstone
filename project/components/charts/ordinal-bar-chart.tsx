"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/charts/chart";
import {
	CHART_AXIS,
	CHART_GRID,
	ORDINAL_RAMP,
	seriesColor,
} from "@/components/charts/palette";
import type { ChartDatum } from "@/lib/types/chart";
import { cn } from "@/lib/utils";

interface OrdinalBarChartProps {
	data: ChartDatum[];
	seriesLabel: string;
	className?: string;
}

/**
 * ordinal bar chart - displays distribution across an ordered scale (e.g.,
 * priority) using a single-hue ramp rather than categorical colors to
 * visually communicate magnitude and direction. Omits a legend as the color
 * scale is intentionally redundant with the x-axis.
 */
export function OrdinalBarChart({
	data,
	seriesLabel,
	className,
}: OrdinalBarChartProps) {
	const config = {
		value: { label: seriesLabel },
	} satisfies ChartConfig;

	return (
		<ChartContainer
			config={config}
			className={cn("aspect-auto h-56 w-full", className)}
		>
			<BarChart
				accessibilityLayer
				data={data}
				margin={{ top: 20, right: 8, bottom: 0, left: 8 }}
			>
				<CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={{ stroke: CHART_AXIS }}
					tickMargin={8}
				/>

				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>

				<Bar dataKey="value" name={seriesLabel} radius={[4, 4, 0, 0]}>
					{data.map((datum, index) => (
						<Cell key={datum.label} fill={seriesColor(index, ORDINAL_RAMP)} />
					))}
					<LabelList
						dataKey="value"
						position="top"
						offset={6}
						className="fill-on-surface text-xs tabular-nums"
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}
