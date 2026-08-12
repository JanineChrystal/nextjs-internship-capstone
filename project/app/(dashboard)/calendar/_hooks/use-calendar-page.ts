import { useCallback, useState } from "react";
import type { Project } from "@/lib/validations/project-schema";
import { useTaskStore } from "@/stores/use-task-store";

export function useCalendarPage() {
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
	const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [editProjectData, setEditProjectData] = useState<Project | undefined>(
		undefined,
	);

	const { openTaskModal } = useTaskStore();

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
		},
		[openTaskModal],
	);

	const handleDateClick = useCallback((_date: Date) => {
		setIsChoiceModalOpen(true);
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
		},
		[openTaskModal],
	);

	return {
		isProjectModalOpen,
		isChoiceModalOpen,
		selectedEventId,
		editProjectData,
		setIsProjectModalOpen,
		setIsChoiceModalOpen,
		setEditProjectData,
		handleSingleClick,
		handleDoubleClick,
		handleDateClick,
		handleCreationProceed,
		openTaskModal,
	};
}
