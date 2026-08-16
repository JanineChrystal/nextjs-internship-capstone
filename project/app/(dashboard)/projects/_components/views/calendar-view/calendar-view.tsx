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
				{/* Main Calendar Grid */}
				<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-6 h-187.5">
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

				{/* Side Panel for Deadlines */}
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
