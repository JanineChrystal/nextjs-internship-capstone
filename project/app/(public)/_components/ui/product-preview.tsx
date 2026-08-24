import { cn } from "@/lib/utils";

/**
 * product preview - an SVG-free UI illustration built from app tokens
 * that stays sharp, supports themes natively, and remains accessible via
 * figcaption.
 */

const STAT_TILES = [
	{ label: "Active projects", value: "12", trend: "+3" },
	{ label: "Tasks in progress", value: "48", trend: "+11" },
	{ label: "Completed", value: "156", trend: "+24" },
	{ label: "Overdue", value: "4", trend: "-2" },
];

/**
 * card mock data - uses explicit IDs instead of array index keys to
 * establish robust habits and prevent future reordering bugs.
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

/** mock chart heights - uses simple percentage values to render chart bars without requiring external chart libraries or complex data. */
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
				// decorative illustration - hides the mock UI from screen readers since the figcaption provides the necessary context.
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
