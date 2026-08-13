import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import type { Project } from "@/lib/validations/project-schema";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export function useCalendarView(_projectId: string) {
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [editProjectData] = useState<Project | undefined>(undefined);

	// In a real implementation, we'd filter by projectId.
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
					comments: 2,
					attachments: 1,
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
		isProjectModalOpen,
		selectedEventId,
		editProjectData,
		calendarEvents,
		sidePanelItems,
		setIsProjectModalOpen,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
	};
}
