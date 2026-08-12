"use client";

import { useMemo, useState } from "react";
import {
	BigCalendar,
	type CalendarEvent,
} from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { ProjectModal } from "@/app/(dashboard)/_components/ui/modals/project-modal";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import type { Project } from "@/lib/validations/project-schema";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

interface CalendarViewProps {
	projectId: string;
}

export function CalendarView({ projectId: _projectId }: CalendarViewProps) {
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [editProjectData] = useState<Project | undefined>(undefined); // For mocked project edit

	// Filter by projectId later on. Here we mock it by taking all tasks that have a dueDate.
	const projectTasks = useMemo(() => {
		return tasks.filter((t) => t.dueDate);
	}, [tasks]);

	const calendarEvents: CalendarEvent[] = useMemo(() => {
		return projectTasks.map((task) => ({
			id: task.id,
			title: task.name,
			// biome-ignore lint/style/noNonNullAssertion: Filtered above
			start: new Date(task.dueDate!),
			// biome-ignore lint/style/noNonNullAssertion: Filtered above
			end: new Date(task.dueDate!),
			allDay: true,
			extendedProps: { type: "task", priority: task.priority },
		}));
	}, [projectTasks]);

	const sidePanelItems: CalendarDeadlineItem[] = useMemo(() => {
		return projectTasks.map(
			(task) =>
				({
					id: task.id,
					title: task.name,
					date: task.dueDate,
					type: "task",
					columnId: task.board,
					priority:
						task.priority.toLowerCase() === "normal"
							? "medium"
							: (task.priority.toLowerCase() as "low" | "medium" | "high"),
					category: task.board,
					comments: 2, // Mocked metadata
					attachments: 1, // Mocked metadata
				}) as CalendarDeadlineItem,
		);
	}, [projectTasks]);

	const handleSingleClick = (item: { id: string }) => {
		setSelectedEventId((prev) => (prev === item.id ? null : item.id));
	};

	const handleDoubleClick = (item: {
		id: string;
		type?: string;
		extendedProps?: Record<string, unknown>;
	}) => {
		// Only tasks exist in this view
		openTaskModal(item.id);
	};

	const handleDateClick = (_date: Date) => {
		// Only tasks can be created here
		openTaskModal();
	};

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
