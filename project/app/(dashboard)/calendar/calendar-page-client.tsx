"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { BigCalendar } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { Button } from "@/components/ui/buttons/button";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask } from "@/types/task";
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

const TaskModal = dynamic(
	() =>
		import(
			"@/app/(dashboard)/_components/ui/modals/task-modal/task-modal"
		).then((m) => m.TaskModal),
	{ ssr: false },
);

interface CalendarPageClientProps {
	initialProjects: Project[];
	initialTasks: GridTask[];
}

export function CalendarPageClient({
	initialProjects,
	initialTasks,
}: CalendarPageClientProps) {
	const setProjects = useProjectStore((state) => state.setProjects);
	const setTasks = useTaskStore((state) => state.setTasks);
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!isInitialized.current) {
			setProjects(initialProjects);
			setTasks(initialTasks);
			isInitialized.current = true;
		}
	}, [initialProjects, initialTasks, setProjects, setTasks]);

	const {
		isProjectModalOpen,
		isChoiceModalOpen,
		selectedEventId,
		selectedDate,
		pendingCreationDate,
		editProjectData,
		calendarEvents,
		upcomingDeadlines,
		setIsProjectModalOpen,
		closeProjectModal,
		setIsChoiceModalOpen,
		setEditProjectData,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleDateCellClick,
		handleCreationProceed,
		openTaskModal,
	} = useCalendarPage();

	return (
		<div className="flex flex-col gap-6 w-full h-full min-h-[calc(100vh-100px)]">
			<PageHeader
				title="Calendar"
				description="View project deadlines and team schedules"
				action={
					// Stacked on a phone. Both buttons carry `w-full sm:w-auto`, so in a
					// flex ROW each one demanded the container's full width and the
					// second overflowed the header card - a stray button edge poking past
					// the right margin. The column is what `w-full` was written for.
					<div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
						<Button
							type="button"
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
							type="button"
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

				<CalendarSidePanel
					title="Upcoming Deadlines"
					items={upcomingDeadlines}
					onItemClick={handleSingleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>

			<ProjectModal
				isOpen={isProjectModalOpen}
				onClose={closeProjectModal}
				initialData={editProjectData}
				prefillDate={editProjectData ? undefined : pendingCreationDate}
			/>
			<CreationChoiceModal
				isOpen={isChoiceModalOpen}
				onClose={() => setIsChoiceModalOpen(false)}
				onProceed={handleCreationProceed}
			/>
			<TaskModal />
		</div>
	);
}
