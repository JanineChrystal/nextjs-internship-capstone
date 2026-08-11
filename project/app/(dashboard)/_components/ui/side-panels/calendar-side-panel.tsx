import { DeadlineCard } from "@/app/(dashboard)/_components/ui/cards/deadline-card";
import type { CalendarDeadlineItem } from "@/types/calendar";

interface CalendarSidePanelProps {
	title?: string;
	items: CalendarDeadlineItem[];
	onItemClick?: (item: CalendarDeadlineItem) => void;
}

export function CalendarSidePanel({
	title = "Upcoming Deadlines",
	items,
	onItemClick,
}: CalendarSidePanelProps) {
	return (
		<div className="xl:col-span-1 bg-surface rounded-xl border border-outline-variant p-6 h-fit max-h-187.5 overflow-y-auto">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-bold text-foreground">{title}</h3>
			</div>

			<div className="flex flex-col gap-4">
				{items.length > 0 ? (
					items.map((item) => (
						<DeadlineCard key={item.id} item={item} onClick={onItemClick} />
					))
				) : (
					<div className="text-center text-sm text-secondary py-8">
						No upcoming items scheduled.
					</div>
				)}
			</div>
		</div>
	);
}
