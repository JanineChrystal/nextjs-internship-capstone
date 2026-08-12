"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
	BigCalendar,
	type CalendarEvent,
} from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";

const ProjectModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { CreationChoiceModal } from "@/app/(dashboard)/calendar/_components/creation-choice-modal";
import { Button } from "@/components/ui/buttons/button";
import type { Project } from "@/lib/validations/project-schema";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export default function CalendarPage() {
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [editProjectData, setEditProjectData] = useState<Project | undefined>(
		undefined,
	); // For mocked project edit

	const { openTaskModal } = useTaskStore();

	const globalEvents: CalendarEvent[] = [
		{
			id: "1",
			title: "Website Redesign",
			start: new Date(2026, 7, 15),
			end: new Date(2026, 7, 15),
			allDay: true,
			extendedProps: { type: "project", priority: "high" },
		},
		{
			id: "2",
			title: "Team Meeting",
			start: new Date(2026, 7, 18, 10, 0),
			end: new Date(2026, 7, 18, 11, 0),
			extendedProps: { type: "task", priority: "medium" },
		},
	];

	const upcomingDeadlines: CalendarDeadlineItem[] = [
		{
			id: "1",
			title: "Website Redesign",
			dueDate: new Date(2026, 7, 15).toISOString(),
			type: "project",
			priority: "high",
		},
		{
			id: "2",
			title: "Team Meeting",
			date: new Date(2026, 7, 18, 10, 0).toISOString(),
			type: "task",
			priority: "medium",
			category: "General",
			columnId: "upcoming",
		},
	];

	const handleSingleClick = (item: { id: string }) => {
		setSelectedEventId((prev) => (prev === item.id ? null : item.id));
	};

	const handleDoubleClick = (item: {
		id: string;
		type?: string;
		extendedProps?: Record<string, unknown>;
	}) => {
		const isProject =
			item.type === "project" || item.extendedProps?.type === "project";

		if (isProject) {
			// Mock project data for edit mode
			setEditProjectData({
				id: item.id,
				title: (item.extendedProps?.title as string) || "Website Redesign",
				status: "active",
				priority: "high",
			} as Project);
			setIsProjectModalOpen(true);
		} else {
			openTaskModal(item.id);
		}
	};

	const handleDateClick = (_date: Date) => {
		// In a real app, you might save this date to pre-fill the modals
		setIsChoiceModalOpen(true);
	};

	const handleCreationProceed = (choice: "project" | "task") => {
		setIsChoiceModalOpen(false);
		if (choice === "project") {
			setEditProjectData(undefined); // Clear edit data to open in create mode
			setIsProjectModalOpen(true);
		} else {
			openTaskModal();
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full h-full min-h-[calc(100vh-100px)]">
			{/* Page Header */}
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

			{/* Main Layout: Calendar (Left) + Event List (Right) */}
			<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1">
				{/* Main Calendar Grid */}
				<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-6 h-187.5">
					<BigCalendar
						events={globalEvents}
						selectedEventId={selectedEventId}
						onEventSingleClick={handleSingleClick}
						onEventDoubleClick={handleDoubleClick}
						onDateClick={handleDateClick}
					/>
				</div>

				{/* Side Panel / Event List (Takes up 1/4 space) */}
				<CalendarSidePanel
					title="Upcoming Deadlines"
					items={upcomingDeadlines}
					onItemClick={handleSingleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>

			{/* Modals */}
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
