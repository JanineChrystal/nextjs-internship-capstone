import { useCallback, useMemo, useState } from "react";
import type { CalendarDeadlineItem, CalendarEvent } from "@/lib/types/calendar";
import { isItemOnDate } from "@/lib/utils/calendar";
import { toDueDateEventRange } from "@/lib/utils/calendar-event";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";

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
				...toDueDateEventRange(new Date(p.dueDate!)),
				extendedProps: {
					type: "project",
					priority: p.priority,
					category: p.category,
					status: p.status,
				},
			}));

		const taskEvents: CalendarEvent[] = tasks
			.filter((t) => t.dueDate && t.dueDate !== "--")
			.map((t) => ({
				id: t.id,
				title: t.name,
				...toDueDateEventRange(new Date(t.dueDate)),
				extendedProps: {
					type: "task",
					priority: t.priority,
					category: t.category,
					status: t.status,
				},
			}));

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
						startDate: p.startDate,
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
						startDate: t.startDate,
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

		return items.filter((item) => isItemOnDate(item, selectedDate));
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
				// pendingCreationDate stays set - ProjectModal reads it as
				// prefillDate and it's cleared when that modal closes.
			} else {
				openTaskModal(undefined, { date: pendingCreationDate ?? undefined });
				setPendingCreationDate(null);
			}
		},
		[openTaskModal, pendingCreationDate],
	);

	const closeProjectModal = useCallback(() => {
		setIsProjectModalOpen(false);
		setPendingCreationDate(null);
	}, []);

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
		closeProjectModal,
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
