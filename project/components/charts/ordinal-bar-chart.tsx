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
 * A distribution across an ordered scale - task priority, low through urgent.
 *
 * The colour here is a single-hue ramp rather than the categorical palette,
 * because priority is not a set of unrelated labels: it has a direction. Four
 * unrelated hues would say "these are four different things"; four steps of one
 * hue say "these are the same thing, more of it".
 *
 * The ramp is redundant with the x-axis on purpose - it encodes information the
 * axis already carries - so no legend is needed and nothing is lost if the
 * reader cannot separate two adjacent steps.
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
