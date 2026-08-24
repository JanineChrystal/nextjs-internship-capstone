"use client";

import { BigCalendar } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { useCalendarView } from "../../../_hooks/use-calendar-view";

interface CalendarViewProps {
	projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
	const {
		selectedEventId,
		selectedDate,
		calendarEvents,
		sidePanelItems,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleDateCellClick,
	} = useCalendarView(projectId);

	return (
		<div className="flex flex-col gap-6 w-full">
			<PageHeader
				title="Calendar"
				description="View task deadlines and schedules for this project."
			/>

			<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full h-full min-h-[calc(100vh-200px)]">
				{/* calendar grid - renders the main month view for scheduling tasks. */}
				<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-3 sm:p-6 h-[70vh] min-h-112.5 xl:h-187.5">
					<BigCalendar
						events={calendarEvents}
						selectedEventId={selectedEventId}
						selectedDate={selectedDate}
						onEventSingleClick={handleSingleClick}
						onEventDoubleClick={handleDoubleClick}
						onDateClick={handleDateClick}
						onDateCellClick={handleDateCellClick}
					/>
				</div>

				{/* side panel - displays upcoming task deadlines contextual to the selected date. */}
				<CalendarSidePanel
					title="Upcoming Tasks Deadlines"
					items={sidePanelItems}
					onItemClick={handleSingleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>
		</div>
	);
}
