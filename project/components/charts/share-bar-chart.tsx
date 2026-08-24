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
 * share bar chart - visualizes part-to-whole relationships as a single
 * stacked horizontal bar for superior visual comparison over pie charts,
 * gracefully handling tiny segments and relying on an integrated legend
 * for precise values.
 */
export function ShareBarChart({
	data,
	unitLabel,
	className,
}: ShareBarChartProps) {
	const total = data.reduce((sum, slice) => sum + slice.value, 0);

	/** pivot data for stacking - transforms the slice array into a single row object for Recharts' stacking model. */
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
							/** segment separation - applies a surface-colored stroke to prevent similarly colored segments from merging visually. */
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
						{/* high contrast text - forces labels and figures to normal ink color to avoid the contrast failures of tinted text. */}
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
