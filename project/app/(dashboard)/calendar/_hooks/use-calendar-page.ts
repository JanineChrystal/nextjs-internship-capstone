import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

export function useCalendarPage() {
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [pendingCreationDate, setPendingCreationDate] = useState<Date | null>(
		null,
	);
	const [editProjectData, setEditProjectData] = useState<Project | undefined>(
		undefined,
	);

	const projects = useProjectStore((state) => state.projects);
	const tasks = useTaskStore((state) => state.tasks);
	const { openTaskModal } = useTaskStore();

	const calendarEvents: CalendarEvent[] = useMemo(() => {
		const projectEvents: CalendarEvent[] = projects
			.filter((p) => p.dueDate)
			.map((p) => ({
				id: p.id,
				title: p.title,
				// biome-ignore lint/style/noNonNullAssertion: Filtered above
				start: new Date(p.dueDate!),
				// biome-ignore lint/style/noNonNullAssertion: Filtered above
				end: new Date(p.dueDate!),
				allDay: true,
				extendedProps: { type: "project", priority: p.priority },
			}));

		const taskEvents: CalendarEvent[] = tasks
			.filter((t) => t.dueDate && t.dueDate !== "--")
			.map((t) => {
				const dueDate = new Date(t.dueDate);
				const startDate =
					t.startDate && t.startDate !== "--" ? new Date(t.startDate) : dueDate;
				const hasExplicitTime =
					dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0;
				return {
					id: t.id,
					title: t.name,
					start: startDate,
					end: dueDate,
					allDay: !hasExplicitTime,
					extendedProps: { type: "task", priority: t.priority },
				};
			});

		return [...projectEvents, ...taskEvents];
	}, [projects, tasks]);

	const upcomingDeadlines: CalendarDeadlineItem[] = useMemo(() => {
		const projectItems: CalendarDeadlineItem[] = projects
			.filter((p) => p.dueDate)
			.map(
				(p) =>
					({
						id: p.id,
						title: p.title,
						dueDate: p.dueDate,
						type: "project",
						category: p.category,
						priority: p.priority,
					}) as CalendarDeadlineItem,
			);

		const taskItems: CalendarDeadlineItem[] = tasks
			.filter((t) => t.dueDate && t.dueDate !== "--")
			.map(
				(t) =>
					({
						id: t.id,
						title: t.name,
						date: t.dueDate,
						type: "task",
						columnId: t.board,
						priority: t.priority.toLowerCase() as "low" | "medium" | "high",
						category: t.board,
						comments: 0,
						attachments: t.attachments?.length ?? 0,
					}) as CalendarDeadlineItem,
			);

		const items = [...projectItems, ...taskItems];
		if (!selectedDate) return items;

		return items.filter((item) => {
			const dateValue = item.type === "project" ? item.dueDate : item.date;
			if (!dateValue) return false;
			return new Date(dateValue).toDateString() === selectedDate.toDateString();
		});
	}, [projects, tasks, selectedDate]);

	const handleSingleClick = useCallback((item: { id: string }) => {
		setSelectedEventId((prev) => (prev === item.id ? null : item.id));
	}, []);

	const handleDoubleClick = useCallback(
		(item: {
			id: string;
			type?: string;
			extendedProps?: Record<string, unknown>;
		}) => {
			const isProject =
				item.type === "project" || item.extendedProps?.type === "project";

			if (isProject) {
				const project = projects.find((p) => p.id === item.id);
				setEditProjectData(project);
				setIsProjectModalOpen(true);
			} else {
				openTaskModal(item.id);
			}
		},
		[openTaskModal, projects],
	);

	// Fired only by the "+" icon - opens the create-project/create-task choice,
	// pre-filled with the date the icon was on.
	const handleDateClick = useCallback((date: Date) => {
		setPendingCreationDate(date);
		setIsChoiceModalOpen(true);
	}, []);

	// Fired when a date cell's background is clicked (not the "+" icon, not
	// an event) - just filters/highlights the side panel, no modal.
	const handleDateCellClick = useCallback((date: Date) => {
		setSelectedDate((prev) =>
			prev && prev.toDateString() === date.toDateString() ? null : date,
		);
	}, []);

	const handleCreationProceed = useCallback(
		(choice: "project" | "task") => {
			setIsChoiceModalOpen(false);
			if (choice === "project") {
				setEditProjectData(undefined);
				setIsProjectModalOpen(true);
			} else {
				openTaskModal();
			}
			setPendingCreationDate(null);
		},
		[openTaskModal],
	);

	return {
		isProjectModalOpen,
		isChoiceModalOpen,
		selectedEventId,
		selectedDate,
		pendingCreationDate,
		editProjectData,
		calendarEvents,
		upcomingDeadlines,
		setIsProjectModalOpen,
		setIsChoiceModalOpen,
		setEditProjectData,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleDateCellClick,
		handleCreationProceed,
		openTaskModal,
	};
}
