import { useState } from "react";
import {
	bulkCompleteTasksAction,
	bulkDeleteTasksAction,
} from "@/lib/actions/task-actions";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { buildConfirmCopy } from "@/lib/constants/confirm-copy";
import type { ConfirmTone } from "@/lib/types/feedback";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { useTaskStore } from "@/stores/use-task-store";

interface UseTaskBulkActionsParams {
	projectId: string;
	selectedTaskIds: Set<string>;
	clearSelection: () => void;
}

interface ConfirmState {
	isOpen: boolean;
	actionType: "complete" | "delete" | null;
	/** task count - captures the number of tasks involved when the action was initiated. */
	count: number;
	/** incomplete checklist flag - indicates if any selected tasks contain unfinished checklist items. */
	hasUnchecked: boolean;
}

const CLOSED: ConfirmState = {
	isOpen: false,
	actionType: null,
	count: 0,
	hasUnchecked: false,
};

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
	const [warningModal, setWarningModal] = useState<ConfirmState>(CLOSED);

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
			reportActionSuccess(
				`${ids.length} ${ids.length === 1 ? "task" : "tasks"} deleted`,
			);
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
			reportActionSuccess(
				`${ids.length} ${ids.length === 1 ? "task" : "tasks"} marked complete`,
			);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not complete the selected tasks", error);
		}
	};

	/**
	 * initiate bulk delete - unconditionally prompts for confirmation before
	 * deleting, adjusting the warning message based on checklist state rather
	 * than bypassing confirmation entirely.
	 */
	const initiateBulkDelete = () => {
		const ids = Array.from(selectedTaskIds);
		if (ids.length === 0) return;

		setWarningModal({
			isOpen: true,
			actionType: "delete",
			count: ids.length,
			hasUnchecked: checkHasIncompleteChecklist(ids),
		});
	};

	/**
	 * initiate bulk complete - bypasses confirmation for reversible completion actions
	 * unless there are unfinished checklists that require explicit user warning.
	 */
	const initiateBulkComplete = () => {
		const ids = Array.from(selectedTaskIds);
		if (ids.length === 0) return;

		if (checkHasIncompleteChecklist(ids)) {
			setWarningModal({
				isOpen: true,
				actionType: "complete",
				count: ids.length,
				hasUnchecked: true,
			});
		} else {
			confirmComplete();
		}
	};

	const confirmWarningAction = () => {
		if (warningModal.actionType === "delete") confirmDelete();
		if (warningModal.actionType === "complete") confirmComplete();
		setWarningModal(CLOSED);
	};

	const closeWarningModal = () => setWarningModal(CLOSED);

	/**
	 * confirmation copy builder - centralizes dynamic dialog messaging based on
	 * action type, selection count, and checklist status to ensure consistency
	 * across different views like grid and kanban.
	 */
	const confirmCopy: {
		title: string;
		description: string;
		confirmLabel: string;
		tone: ConfirmTone;
	} = (() => {
		const { actionType, count, hasUnchecked } = warningModal;
		const isDelete = actionType === "delete";

		const base = buildConfirmCopy({
			action: isDelete ? "delete" : "complete",
			subject: "task",
			count,
			// consequence overriding - provides specialized warnings for incomplete checklists while relying on default copy for standard actions.
			consequence: hasUnchecked
				? isDelete
					? `Some still have unchecked checklist items, which go to the trash with them and are deleted permanently after ${TRASH_RETENTION_DAYS} days.`
					: "Some still have unchecked checklist items. Completing the task does not tick those off."
				: undefined,
		});

		return { ...base, tone: isDelete ? "danger" : "warning" };
	})();

	return {
		warningModal,
		confirmCopy,
		initiateBulkDelete,
		initiateBulkComplete,
		confirmWarningAction,
		closeWarningModal,
	};
}
