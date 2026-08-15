import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export function useCalendarView(projectId: string) {
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

	const projectTasks = useMemo(() => {
		return tasks.filter((t) => t.dueDate && t.projectId === projectId);
	}, [tasks, projectId]);

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
					priority: task.priority.toLowerCase() as "low" | "medium" | "high",
					category: task.board,
					comments: 0,
					attachments: task.attachments?.length ?? 0,
				}) as CalendarDeadlineItem,
		);
	}, [projectTasks]);

	const handleSingleClick = useCallback((item: { id: string }) => {
		setSelectedEventId((prev) => (prev === item.id ? null : item.id));
	}, []);

	const handleDoubleClick = useCallback(
		(item: {
			id: string;
			type?: string;
			extendedProps?: Record<string, unknown>;
		}) => {
			openTaskModal(item.id);
		},
		[openTaskModal],
	);

	const handleDateClick = useCallback(
		(_date: Date) => {
			openTaskModal();
		},
		[openTaskModal],
	);

	return {
		selectedEventId,
		calendarEvents,
		sidePanelItems,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
	};
}
