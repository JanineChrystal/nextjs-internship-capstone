"use client";

import { useMemo } from "react";
import {
	BigCalendar,
	type CalendarEvent,
} from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { CalendarSidePanel } from "@/app/(dashboard)/_components/ui/side-panels";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

interface CalendarViewProps {
	projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	// In a real app, you would filter by projectId. Here we mock it by taking all tasks that have a dueDate.
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
					columnId: task.board, // Satisfy TaskItem requirement
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

	return (
		<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full h-full min-h-[calc(100vh-200px)]">
			{/* Main Calendar Grid */}
			<div className="xl:col-span-3 bg-surface rounded-xl border border-outline-variant p-6 h-187.5">
				<BigCalendar
					events={calendarEvents}
					onSelectEvent={(e) => openTaskModal(e.id)}
				/>
			</div>

			{/* Side Panel for Deadlines */}
			<CalendarSidePanel
				title="Project Deadlines"
				items={sidePanelItems}
				onItemClick={(item) => openTaskModal(item.id)}
			/>
		</div>
	);
}
