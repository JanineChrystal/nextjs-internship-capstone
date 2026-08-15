import type * as React from "react";
import {
	createChecklistItemAction,
	deleteChecklistItemAction,
	updateChecklistItemAction,
} from "@/lib/actions/checklist-actions";
import type { GridTask } from "@/types/task";

interface UseTaskChecklistParams {
	taskData: Partial<GridTask>;
	setTaskData: React.Dispatch<React.SetStateAction<Partial<GridTask>>>;
	isEditMode: boolean;
	selectedTaskId: string | null;
	projectId: string;
}

export function useTaskChecklist({
	taskData,
	setTaskData,
	isEditMode,
	selectedTaskId,
	projectId,
}: UseTaskChecklistParams) {
	const addChecklistItem = async () => {
		const tempId = crypto.randomUUID();
		const newItem = { id: tempId, title: "", completed: false };
		setTaskData((prev) => ({
			...prev,
			checklist: [...(prev.checklist || []), newItem],
		}));

		if (!isEditMode || !selectedTaskId || !projectId) return;
		const result = await createChecklistItemAction(
			selectedTaskId,
			projectId,
			"",
		);
		if (result.success && result.data) {
			const realId = result.data.id;
			setTaskData((prev) => ({
				...prev,
				checklist: (prev.checklist || []).map((item) =>
					item.id === tempId ? { ...item, id: realId } : item,
				),
			}));
		}
	};

	const updateChecklistItem = (
		id: string,
		updates: Partial<{ title: string; completed: boolean }>,
	) => {
		setTaskData((prev) => ({
			...prev,
			checklist: (prev.checklist || []).map((item) =>
				item.id === id ? { ...item, ...updates } : item,
			),
		}));
	};

	const commitChecklistItem = async (id: string) => {
		if (!isEditMode || !selectedTaskId || !projectId) return;
		const item = (taskData.checklist || []).find((i) => i.id === id);
		if (!item) return;

		const result = await updateChecklistItemAction(id, projectId, {
			title: item.title,
		});
		if (!result.success) {
			console.error("Failed to save checklist item:", result.error);
		}
	};

	const toggleChecklistItem = async (id: string, completed: boolean) => {
		updateChecklistItem(id, { completed });
		if (!isEditMode || !selectedTaskId || !projectId) return;

		const result = await updateChecklistItemAction(id, projectId, {
			isCompleted: completed,
		});
		if (!result.success) {
			updateChecklistItem(id, { completed: !completed });
			console.error("Failed to toggle checklist item:", result.error);
		}
	};

	const removeChecklistItem = async (id: string) => {
		const previousChecklist = taskData.checklist;
		setTaskData((prev) => ({
			...prev,
			checklist: (prev.checklist || []).filter((item) => item.id !== id),
		}));

		if (!isEditMode || !selectedTaskId || !projectId) return;
		const result = await deleteChecklistItemAction(id, projectId);
		if (!result.success) {
			setTaskData((prev) => ({ ...prev, checklist: previousChecklist }));
			console.error("Failed to delete checklist item:", result.error);
		}
	};

	return {
		addChecklistItem,
		updateChecklistItem,
		commitChecklistItem,
		toggleChecklistItem,
		removeChecklistItem,
	};
}
