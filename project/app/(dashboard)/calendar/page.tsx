"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { BigCalendar } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { Button } from "@/components/ui/buttons/button";
import { globalEvents, upcomingDeadlines } from "./_constants/mock-data";
import { useCalendarPage } from "./_hooks/use-calendar-page";

const ProjectModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

const CreationChoiceModal = dynamic(
	() =>
		import("@/app/(dashboard)/calendar/_components/creation-choice-modal").then(
			(m) => m.CreationChoiceModal,
		),
	{ ssr: false },
);

export default function CalendarPage() {
	const {
		isProjectModalOpen,
		isChoiceModalOpen,
		selectedEventId,
		editProjectData,
		setIsProjectModalOpen,
		setIsChoiceModalOpen,
		setEditProjectData,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleCreationProceed,
		openTaskModal,
	} = useCalendarPage();

	return (
		<div className="flex flex-col gap-6 w-full h-full min-h-[calc(100vh-100px)]">
			<PageHeader
				title="Calendar"
				description="View project deadlines and team schedules"
				action={
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<Button
							variant="outline"
							className="w-full sm:w-auto"
							onClick={() => {
								setEditProjectData(undefined);
								setIsProjectModalOpen(true);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Create Project
						</Button>
						<Button
							className="w-full sm:w-auto"
							onClick={() => openTaskModal()}
						>
							<Plus className="w-4 h-4 mr-2" />
							Create Task
						</Button>
					</div>
				}
			/>

			<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1">
				<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-6 h-187.5">
					<BigCalendar
						events={globalEvents}
						selectedEventId={selectedEventId}
						onEventSingleClick={handleSingleClick}
						onEventDoubleClick={handleDoubleClick}
						onDateClick={handleDateClick}
					/>
				</div>

				<CalendarSidePanel
					title="Upcoming Deadlines"
					items={upcomingDeadlines}
					onItemClick={handleSingleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>

			<ProjectModal
				isOpen={isProjectModalOpen}
				onClose={() => setIsProjectModalOpen(false)}
				initialData={editProjectData}
			/>
			<CreationChoiceModal
				isOpen={isChoiceModalOpen}
				onClose={() => setIsChoiceModalOpen(false)}
				onProceed={handleCreationProceed}
			/>
		</div>
	);
}
