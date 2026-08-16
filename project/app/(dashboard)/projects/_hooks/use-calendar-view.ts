import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import { isItemOnDate } from "@/lib/utils/calendar";
import { toDueDateEventRange } from "@/lib/utils/calendar-event";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export function useCalendarView(projectId: string) {
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const projectTasks = useMemo(() => {
		// "--" is the placeholder for "no due date" - it is truthy, so it has to
		// be excluded explicitly or it reaches the calendar as an invalid date.
		return tasks.filter(
			(t) => t.dueDate && t.dueDate !== "--" && t.projectId === projectId,
		);
	}, [tasks, projectId]);

	const calendarEvents: CalendarEvent[] = useMemo(() => {
		return projectTasks.map((task) => {
			return {
				id: task.id,
				title: task.name,
				// biome-ignore lint/style/noNonNullAssertion: Filtered above
				...toDueDateEventRange(new Date(task.dueDate!)),
				extendedProps: {
					type: "task",
					priority: task.priority,
					category: task.category,
					status: task.status,
				},
			};
		});
	}, [projectTasks]);

	const sidePanelItems: CalendarDeadlineItem[] = useMemo(() => {
		const items = projectTasks.map(
			(task) =>
				({
					id: task.id,
					title: task.name,
					date: task.dueDate,
					startDate: task.startDate,
					type: "task",
					columnId: task.board,
					priority: task.priority.toLowerCase() as "low" | "medium" | "high",
					category: task.board,
					comments: 0,
					attachments: task.attachments?.length ?? 0,
				}) as CalendarDeadlineItem,
		);

		if (!selectedDate) return items;

		return items.filter((item) => isItemOnDate(item, selectedDate));
	}, [projectTasks, selectedDate]);

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

	// Fired only by the "+" icon - opens the create-task modal pre-filled
	// with the clicked date.
	const handleDateClick = useCallback(
		(date: Date) => {
			openTaskModal(undefined, { date });
		},
		[openTaskModal],
	);

	// Fired when a date cell's background is clicked (not the "+" icon, not
	// an event) - just filters/highlights the side panel, no modal.
	const handleDateCellClick = useCallback((date: Date) => {
		setSelectedDate((prev) =>
			prev && prev.toDateString() === date.toDateString() ? null : date,
		);
	}, []);

	return {
		selectedEventId,
		selectedDate,
		calendarEvents,
		sidePanelItems,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleDateCellClick,
	};
}
