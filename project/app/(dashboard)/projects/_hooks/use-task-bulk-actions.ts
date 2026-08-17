import { useState } from "react";
import {
	bulkCompleteTasksAction,
	bulkDeleteTasksAction,
} from "@/lib/actions/task-actions";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import { reportActionError } from "@/lib/utils/toast";
import { useTaskStore } from "@/stores/use-task-store";

interface UseTaskBulkActionsParams {
	projectId: string;
	selectedTaskIds: Set<string>;
	clearSelection: () => void;
}

export function useTaskBulkActions({
	projectId,
	selectedTaskIds,
	clearSelection,
}: UseTaskBulkActionsParams) {
	// External Stores
	const tasks = useTaskStore((state) => state.tasks);
	const bulkDeleteTasksInStore = useTaskStore((state) => state.bulkDeleteTasks);
	const bulkCompleteTasksInStore = useTaskStore(
		(state) => state.bulkCompleteTasks,
	);

	// Local State
	const [warningModal, setWarningModal] = useState<{
		isOpen: boolean;
		actionType: "complete" | "delete" | null;
	}>({ isOpen: false, actionType: null });

	// Handlers
	const checkHasIncompleteChecklist = (ids: string[]) =>
		tasks.some((t) => ids.includes(t.id) && hasIncompleteChecklist(t));

	const confirmDelete = async () => {
		if (selectedTaskIds.size === 0) return;
		const previousTasks = useTaskStore.getState().tasks;
		const ids = Array.from(selectedTaskIds);

		bulkDeleteTasksInStore(selectedTaskIds);
		clearSelection();

		try {
			const result = await bulkDeleteTasksAction(ids, projectId);
			if (result && !result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not delete the selected tasks", error);
		}
	};

	const confirmComplete = async () => {
		if (selectedTaskIds.size === 0) return;
		const previousTasks = useTaskStore.getState().tasks;
		const ids = Array.from(selectedTaskIds);

		bulkCompleteTasksInStore(selectedTaskIds);
		clearSelection();

		try {
			const result = await bulkCompleteTasksAction(ids, projectId);
			if (result && !result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not complete the selected tasks", error);
		}
	};

	const initiateBulkDelete = () => {
		if (checkHasIncompleteChecklist(Array.from(selectedTaskIds))) {
			setWarningModal({ isOpen: true, actionType: "delete" });
		} else {
			confirmDelete();
		}
	};

	const initiateBulkComplete = () => {
		if (checkHasIncompleteChecklist(Array.from(selectedTaskIds))) {
			setWarningModal({ isOpen: true, actionType: "complete" });
		} else {
			confirmComplete();
		}
	};

	const confirmWarningAction = () => {
		if (warningModal.actionType === "delete") confirmDelete();
		if (warningModal.actionType === "complete") confirmComplete();
		setWarningModal({ isOpen: false, actionType: null });
	};

	const closeWarningModal = () =>
		setWarningModal({ isOpen: false, actionType: null });

	return {
		warningModal,
		initiateBulkDelete,
		initiateBulkComplete,
		confirmWarningAction,
		closeWarningModal,
	};
}
