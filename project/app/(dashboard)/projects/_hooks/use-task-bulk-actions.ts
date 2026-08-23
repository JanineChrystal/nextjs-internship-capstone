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
	/** How many tasks the pending action covers, captured when it was raised. */
	count: number;
	/** Whether any of them still has unchecked checklist items. */
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
	 * Deleting always asks, whatever the checklists say.
	 *
	 * This used to confirm ONLY when a selected task still had unchecked
	 * checklist items, and otherwise deleted immediately. The effect was that
	 * a tidy project - every checklist finished - was the one where a bulk
	 * delete happened with no confirmation at all, which is exactly backwards.
	 * The checklist state now changes the WORDING, not whether the question is
	 * asked.
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
	 * Completing only asks when there is something to warn about.
	 *
	 * Unlike a delete this is reversible - a task can be reopened - so a
	 * confirmation on every bulk complete would be friction with nothing behind
	 * it. The unchecked-checklist case is different: the reader is likely to
	 * assume completing the task ticks its items off, and it does not.
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
	 * The dialog's wording, built here rather than in the views.
	 *
	 * Both the grid and the kanban board render this dialog, and each carried
	 * its own hand-written copy - two identical ternaries that would have to be
	 * changed together and eventually would not be. The hook is the only place
	 * that knows both the count and the checklist state, so it is where the
	 * sentence belongs.
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
			// Only overridden when there is something extra to say. Leaving it
			// undefined lets the default through, which for a delete describes the
			// trash window rather than claiming the deletion is permanent.
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
