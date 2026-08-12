"use client";

import dynamic from "next/dynamic";
import { BigCalendar } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { useCalendarView } from "../../../_hooks/use-calendar-view";

const ProjectModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

interface CalendarViewProps {
	projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
	const {
		isProjectModalOpen,
		selectedEventId,
		editProjectData,
		calendarEvents,
		sidePanelItems,
		setIsProjectModalOpen,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
	} = useCalendarView(projectId);

	return (
		<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full h-full min-h-[calc(100vh-200px)]">
			{/* Main Calendar Grid */}
			<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-6 h-187.5">
				<BigCalendar
					events={calendarEvents}
					selectedEventId={selectedEventId}
					onEventSingleClick={handleSingleClick}
					onEventDoubleClick={handleDoubleClick}
					onDateClick={handleDateClick}
				/>
			</div>

			{/* Side Panel for Deadlines */}
			<CalendarSidePanel
				title="Upcoming Tasks Deadlines"
				items={sidePanelItems}
				onItemClick={handleSingleClick}
				onItemDoubleClick={handleDoubleClick}
			/>

			<ProjectModal
				isOpen={isProjectModalOpen}
				onClose={() => setIsProjectModalOpen(false)}
				initialData={editProjectData}
			/>
		</div>
	);
}
