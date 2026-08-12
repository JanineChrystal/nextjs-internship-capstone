import { useState } from "react";
import type { CalendarDeadlineItem } from "@/types/calendar";

export function useCalendarSelection(items: CalendarDeadlineItem[]) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [alertMessage, setAlertMessage] = useState<string | null>(null);

	const handleToggleSelect = (item: CalendarDeadlineItem) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(item.id)) {
			newSelected.delete(item.id);
		} else {
			newSelected.add(item.id);
		}
		setSelectedIds(newSelected);
		setAlertMessage(null);
	};

	const handleClearSelection = () => {
		setSelectedIds(new Set());
		setAlertMessage(null);
	};

	const checkProjectSafety = (action: string) => {
		const selectedItems = items.filter((item) => selectedIds.has(item.id));
		const hasProject = selectedItems.some((item) => item.type === "project");

		if (hasProject) {
			setAlertMessage(
				`Cannot bulk ${action} projects. Please remove projects from your selection.`,
			);
			return false;
		}
		return true;
	};

	const handleBulkDelete = () => {
		if (!checkProjectSafety("delete")) return;
		// TODO: Implement actual store deletion
		console.log("Delete tasks:", Array.from(selectedIds));
		handleClearSelection();
	};

	const handleBulkComplete = () => {
		if (!checkProjectSafety("complete")) return;
		// TODO: Implement actual store completion
		console.log("Complete tasks:", Array.from(selectedIds));
		handleClearSelection();
	};

	return {
		selectedIds,
		alertMessage,
		setAlertMessage,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
	};
}
