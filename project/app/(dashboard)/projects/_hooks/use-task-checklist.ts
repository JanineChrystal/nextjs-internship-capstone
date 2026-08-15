import * as React from "react";
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
	// Tracks the in-flight "create" request for each optimistic temp id, so
	// a fast type-then-blur can await the real server id instead of racing it
	// (updating against a temp id that doesn't exist server-side yet).
	const pendingCreates = React.useRef<Map<string, Promise<string | null>>>(
		new Map(),
	);

	const resolveItemId = async (id: string): Promise<string | null> => {
		const pending = pendingCreates.current.get(id);
		return pending ? await pending : id;
	};

	const addChecklistItem = async () => {
		const tempId = crypto.randomUUID();
		const newItem = { id: tempId, title: "", completed: false };
		setTaskData((prev) => ({
			...prev,
			checklist: [...(prev.checklist || []), newItem],
		}));

		if (!isEditMode || !selectedTaskId || !projectId) return;

		const creationPromise = (async () => {
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
				return realId;
			}
			console.error("Failed to create checklist item:", result.error);
			return null;
		})();

		pendingCreates.current.set(tempId, creationPromise);
		await creationPromise;
		pendingCreates.current.delete(tempId);
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

	const commitChecklistItem = async (id: string, title: string) => {
		if (!isEditMode || !projectId) return;
		const realId = await resolveItemId(id);
		if (!realId) return;

		const result = await updateChecklistItemAction(realId, projectId, {
			title,
		});
		if (!result.success) {
			console.error("Failed to save checklist item:", result.error);
		}
	};

	const toggleChecklistItem = async (id: string, completed: boolean) => {
		updateChecklistItem(id, { completed });
		if (!isEditMode || !projectId) return;

		const realId = await resolveItemId(id);
		if (!realId) return;

		const result = await updateChecklistItemAction(realId, projectId, {
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

		if (!isEditMode || !projectId) return;
		const realId = await resolveItemId(id);
		if (!realId) return;

		const result = await deleteChecklistItemAction(realId, projectId);
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
