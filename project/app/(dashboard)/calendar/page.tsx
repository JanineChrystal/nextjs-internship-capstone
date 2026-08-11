"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
	BigCalendar,
	type CalendarEvent,
} from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { CreateProjectModal } from "@/app/(dashboard)/projects/_components/ui/modals/create-project-modal";
import { Button } from "@/components/ui/buttons/button";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export default function CalendarPage() {
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const { openTaskModal } = useTaskStore();

	const globalEvents: CalendarEvent[] = [
		{
			id: "1",
			title: "Website Redesign",
			start: new Date(2026, 7, 15),
			end: new Date(2026, 7, 15),
			allDay: true,
		},
		{
			id: "2",
			title: "Team Meeting",
			start: new Date(2026, 7, 18, 10, 0),
			end: new Date(2026, 7, 18, 11, 0),
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
							onClick={() => setIsProjectModalOpen(true)}
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
						onSelectEvent={(e) => console.log(e)}
					/>
				</div>

				{/* Side Panel / Event List (Takes up 1/4 space) */}
				<CalendarSidePanel
					title="Global Deadlines"
					items={upcomingDeadlines}
					onItemClick={(item) => console.log(item)}
				/>
			</div>

			{/* Modals */}
			<CreateProjectModal
				isOpen={isProjectModalOpen}
				onClose={() => setIsProjectModalOpen(false)}
			/>
		</div>
	);
}
