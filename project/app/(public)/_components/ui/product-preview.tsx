import { cn } from "@/lib/utils";

/**
 * A drawn mock of the product, not a screenshot.
 *
 * The trade-off, since it is the obvious question: a screenshot would show the
 * real thing, but it would be a fixed-size raster that goes stale the first time
 * a button moves, ships as a large image on the page a visitor loads first, and
 * - the deciding reason - would be locked to whichever theme it was captured in,
 * so half of all visitors would see a light screenshot on a dark page.
 *
 * This is built from the same design tokens as the app, so it follows light and
 * dark mode, will follow the Phase 7 palette picker for free, weighs nothing,
 * and stays sharp at any size. It is clearly labelled as an illustration and
 * hidden from assistive technology, because reading out sixteen empty rectangles
 * would tell a screen-reader user nothing the surrounding copy does not.
 */

const STAT_TILES = [
	{ label: "Active projects", value: "12", trend: "+3" },
	{ label: "Tasks in progress", value: "48", trend: "+11" },
	{ label: "Completed", value: "156", trend: "+24" },
	{ label: "Overdue", value: "4", trend: "-2" },
];

/**
 * Each mock card carries its own id rather than being keyed by position. The
 * list never reorders, so an index key would work today - but a key derived from
 * position is a habit that quietly breaks the first time a list does reorder,
 * and it is not worth practising here to save eight characters.
 */
const COLUMNS: {
	name: string;
	tone: string;
	cards: { id: string; width: number }[];
}[] = [
	{
		name: "To do",
		tone: "bg-chart-status-not-started",
		cards: [
			{ id: "todo-a", width: 70 },
			{ id: "todo-b", width: 90 },
			{ id: "todo-c", width: 55 },
		],
	},
	{
		name: "In progress",
		tone: "bg-chart-status-in-progress",
		cards: [
			{ id: "doing-a", width: 85 },
			{ id: "doing-b", width: 60 },
		],
	},
	{
		name: "Done",
		tone: "bg-chart-status-completed",
		cards: [
			{ id: "done-a", width: 75 },
			{ id: "done-b", width: 95 },
			{ id: "done-c", width: 65 },
		],
	},
];

/** Heights as percentages, so the bars need no data and no chart library. */
const BAR_HEIGHTS = [38, 62, 45, 78, 55, 88, 70, 96, 60, 82, 48, 72].map(
	(height, index) => ({ id: `week-${index + 1}`, height }),
);

function WindowChrome() {
	return (
		<div className="flex items-center gap-2 border-b border-border bg-surface-container px-4 py-3">
			<span className="h-2.5 w-2.5 rounded-full bg-chart-status-overdue/70" />
			<span className="h-2.5 w-2.5 rounded-full bg-chart-status-not-started/70" />
			<span className="h-2.5 w-2.5 rounded-full bg-chart-status-completed/70" />
			<div className="ml-4 h-5 flex-1 rounded-md bg-surface-container-highest/70" />
		</div>
	);
}

export function ProductPreview({ className }: { className?: string }) {
	return (
		<figure className={cn("m-0", className)}>
			<div
				// aria-hidden: decoration. The figcaption below carries the meaning.
				aria-hidden="true"
				className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
			>
				<WindowChrome />

				<div className="flex">
					{/* Sidebar */}
					<div className="hidden w-40 shrink-0 flex-col gap-2 border-r border-border bg-surface-container-low p-3 sm:flex">
						<div className="mb-2 h-6 w-24 rounded bg-primary/25" />
						{[0, 1, 2, 3, 4, 5].map((row) => (
							<div
								key={row}
								className={cn(
									"h-6 rounded",
									row === 1
										? "bg-primary/20"
										: "bg-surface-container-highest/60",
								)}
								style={{ width: `${88 - row * 6}%` }}
							/>
						))}
					</div>

					<div className="flex-1 p-4 sm:p-5">
						{/* Stat tiles */}
						<div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
							{STAT_TILES.map((tile) => (
								<div
									key={tile.label}
									className="rounded-lg border border-border bg-surface-container-lowest p-3"
								>
									<div className="text-[10px] uppercase tracking-wide text-secondary">
										{tile.label}
									</div>
									<div className="mt-1 flex items-baseline gap-1.5">
										<span className="text-lg font-semibold text-on-surface">
											{tile.value}
										</span>
										<span className="text-[10px] text-secondary">
											{tile.trend}
										</span>
									</div>
								</div>
							))}
						</div>

						<div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
							{/* Board columns */}
							<div className="grid grid-cols-3 gap-2">
								{COLUMNS.map((column) => (
									<div
										key={column.name}
										className="flex flex-col gap-2 rounded-lg border border-border bg-surface-container-low p-2"
									>
										<div className="flex items-center gap-1.5">
											<span
												className={cn("h-1.5 w-1.5 rounded-full", column.tone)}
											/>
											<span className="truncate text-[10px] font-medium text-on-surface">
												{column.name}
											</span>
										</div>
										{column.cards.map((card) => (
											<div
												key={card.id}
												className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-2"
											>
												<div
													className="h-1.5 rounded bg-on-surface/25"
													style={{ width: `${card.width}%` }}
												/>
												<div className="h-1.5 w-1/2 rounded bg-on-surface/12" />
												<div className="flex items-center gap-1 pt-0.5">
													<span className="h-3 w-3 rounded-full bg-primary/30" />
													<span
														className={cn(
															"h-1.5 w-6 rounded-full",
															column.tone,
															"opacity-60",
														)}
													/>
												</div>
											</div>
										))}
									</div>
								))}
							</div>

							{/* Chart panel */}
							<div className="hidden flex-col rounded-lg border border-border bg-surface-container-lowest p-3 lg:flex">
								<div className="mb-3 h-2 w-24 rounded bg-on-surface/20" />
								<div className="flex h-28 items-end gap-1.5">
									{BAR_HEIGHTS.map((bar) => (
										<div
											key={bar.id}
											className="flex-1 rounded-t-[3px] bg-primary/60"
											style={{ height: `${bar.height}%` }}
										/>
									))}
								</div>
								<div className="mt-3 flex flex-col gap-1.5">
									{[0, 1, 2].map((row) => (
										<div key={row} className="flex items-center gap-2">
											<span className="h-2 w-2 rounded-full bg-chart-1" />
											<span
												className="h-1.5 rounded bg-on-surface/15"
												style={{ width: `${60 - row * 12}%` }}
											/>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<figcaption className="sr-only">
				An illustration of the Takda PH dashboard: project totals, a kanban
				board with To do, In progress and Done columns, and a throughput chart.
			</figcaption>
		</figure>
	);
}
