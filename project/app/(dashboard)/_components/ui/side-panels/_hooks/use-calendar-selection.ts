import { useState } from "react";
import {
	bulkCompleteTasksAction,
	bulkDeleteTasksAction,
} from "@/lib/actions/task-actions";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { buildConfirmCopy } from "@/lib/constants/confirm-copy";
import type { ConfirmTone } from "@/lib/types/feedback";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import {
	notify,
	reportActionError,
	reportActionSuccess,
} from "@/lib/utils/toast";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

/**
 * What the calendar's bulk bar offers.
 *
 * Archive is deliberately absent. Only a project can be archived, and no bulk
 * action here may touch a project, so an Archive button could never succeed -
 * and a control that looks pressable but cannot work is worse than one that was
 * never offered. Archiving lives on the projects list and in a project's own
 * settings, both of which still have it.
 */
type ActionType = "complete" | "delete";

interface ConfirmState {
	isOpen: boolean;
	actionType: ActionType | null;
	/** How many tasks the pending action covers, captured when it was raised. */
	count: number;
	/** Whether any of them still has unticked checklist items. */
	hasUnchecked: boolean;
}

const CLOSED: ConfirmState = {
	isOpen: false,
	actionType: null,
	count: 0,
	hasUnchecked: false,
};

/**
 * Why a project is refused, and where to go instead.
 *
 * Each names the destination rather than only saying no. A refusal that does not
 * say where the action lives leaves the reader hunting for it, and the usual
 * next move is to try the same button again.
 */
const PROJECT_REFUSAL: Record<ActionType, string> = {
	delete:
		"Projects cannot be deleted from the calendar. Open the project's Settings > Danger Zone.",
	complete:
		"Projects cannot be completed from the calendar. Open the project and complete it there.",
};

/** What to add when something in the selection still has unticked items. */
const UNCHECKED_CONSEQUENCE: Record<ActionType, string> = {
	delete: `Some still have unchecked checklist items, which go to the trash with them and are deleted permanently after ${TRASH_RETENTION_DAYS} days.`,
	complete:
		"Some still have unchecked checklist items. Completing the task does not tick those off.",
};

// Groups a flat task id list by the project each task belongs to, since the
// underlying bulk task actions are permission-checked per project.
function groupTaskIdsByProject(
	taskIds: string[],
	tasks: { id: string; projectId?: string }[],
): Record<string, string[]> {
	const groups: Record<string, string[]> = {};
	for (const id of taskIds) {
		const projectId = tasks.find((t) => t.id === id)?.projectId;
		if (!projectId) continue;
		groups[projectId] = groups[projectId] ? [...groups[projectId], id] : [id];
	}
	return groups;
}

/**
 * Bulk selection and actions for the calendar side panel.
 *
 * Used by two surfaces: the global calendar, whose items are projects *and*
 * tasks, and a project's own calendar view, whose items are tasks only. The
 * project rule below therefore never fires on the second one - not because it is
 * special-cased, but because it has no projects to select.
 *
 * ## No bulk action here may touch a project
 *
 * A project is deleted, completed or archived from the projects list or from its
 * own settings, and nowhere else. On a calendar a project renders as one small
 * row, visually indistinguishable from a task, but acting on it reaches its
 * tasks, its board, its comments and its members' work. Two rows that look
 * identical should not have outcomes three orders of magnitude apart.
 *
 * The refusal covers the whole selection rather than quietly proceeding with the
 * tasks in it. Half-applying a bulk action is worse than refusing it: the reader
 * asked for one thing, and would be told it succeeded having got something else.
 *
 * Nothing is lost by refusing here. Both routes that *do* delete a project -
 * the bulk bar on `/projects` and the Danger Zone - carry the same
 * ongoing-work check this panel used to duplicate.
 *
 * ## Deleting always asks
 *
 * The confirmation used to be raised only when something unfinished was
 * selected, and anything tidy was deleted immediately. That is backwards: it
 * means a finished task, the one most likely to be worth keeping, was the one
 * deleted without a question. Unticked checklist items now change the WORDING,
 * not whether the question is asked - the same rule already applied to the grid
 * and kanban bulk actions in `use-task-bulk-actions.ts`.
 */
export function useCalendarSelection(items: CalendarDeadlineItem[]) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [confirmState, setConfirmState] = useState<ConfirmState>(CLOSED);

	const tasks = useTaskStore((s) => s.tasks);
	const bulkDeleteTasksInStore = useTaskStore((s) => s.bulkDeleteTasks);
	const bulkCompleteTasksInStore = useTaskStore((s) => s.bulkCompleteTasks);

	const handleToggleSelect = (item: CalendarDeadlineItem) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(item.id)) {
			newSelected.delete(item.id);
		} else {
			newSelected.add(item.id);
		}
		setSelectedIds(newSelected);
	};

	const handleClearSelection = () => setSelectedIds(new Set());

	const getSelectedByType = () => {
		const selectedItems = items.filter((item) => selectedIds.has(item.id));
		return {
			projectIds: selectedItems
				.filter((item) => item.type === "project")
				.map((item) => item.id),
			taskIds: selectedItems
				.filter((item) => item.type === "task")
				.map((item) => item.id),
		};
	};

	const hasUncheckedChecklist = (taskIds: string[]) =>
		tasks.some((t) => taskIds.includes(t.id) && hasIncompleteChecklist(t));

	const executeDelete = async () => {
		// Filtered here as well as at the door. `initiateAction` refuses the whole
		// selection when a project is present, so this should be unreachable - but
		// a delete is the wrong place to depend on a guard elsewhere still being
		// correct, which is exactly the failure that produced this bug.
		const { taskIds } = getSelectedByType();
		if (taskIds.length === 0) return;

		const previousTasks = useTaskStore.getState().tasks;

		bulkDeleteTasksInStore(new Set(taskIds));
		handleClearSelection();

		try {
			const taskGroups = groupTaskIdsByProject(taskIds, tasks);
			await Promise.all(
				Object.entries(taskGroups).map(([projectId, ids]) =>
					bulkDeleteTasksAction(ids, projectId),
				),
			);
			reportActionSuccess(
				`${taskIds.length} ${taskIds.length === 1 ? "task" : "tasks"} deleted`,
			);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not delete the selected tasks", error);
		}
	};

	const executeComplete = async () => {
		const { taskIds } = getSelectedByType();
		if (taskIds.length === 0) return;

		const previousTasks = useTaskStore.getState().tasks;

		bulkCompleteTasksInStore(new Set(taskIds));
		handleClearSelection();

		try {
			const taskGroups = groupTaskIdsByProject(taskIds, tasks);
			await Promise.all(
				Object.entries(taskGroups).map(([projectId, ids]) =>
					bulkCompleteTasksAction(ids, projectId),
				),
			);
			reportActionSuccess(
				`${taskIds.length} ${taskIds.length === 1 ? "task" : "tasks"} marked complete`,
			);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not complete the selected tasks", error);
		}
	};

	const initiateAction = (actionType: ActionType) => {
		const { projectIds, taskIds } = getSelectedByType();
		if (projectIds.length === 0 && taskIds.length === 0) return;

		if (projectIds.length > 0) {
			notify.warning(PROJECT_REFUSAL[actionType]);
			return;
		}

		const hasUnchecked = hasUncheckedChecklist(taskIds);

		// Completing is reversible - a task can be reopened - so it only asks when
		// there is something to warn about. A confirmation on every one would be
		// friction with nothing behind it, and it is how people learn to click
		// through the dialog that mattered. Deleting always asks.
		if (actionType === "complete" && !hasUnchecked) {
			executeComplete();
			return;
		}

		setConfirmState({
			isOpen: true,
			actionType,
			count: taskIds.length,
			hasUnchecked,
		});
	};

	const handleBulkComplete = () => initiateAction("complete");
	const handleBulkDelete = () => initiateAction("delete");

	const confirmAction = () => {
		if (confirmState.actionType === "complete") executeComplete();
		if (confirmState.actionType === "delete") executeDelete();
		setConfirmState(CLOSED);
	};

	const closeConfirm = () => setConfirmState(CLOSED);

	/**
	 * The dialog's wording, built here rather than in the panel.
	 *
	 * The panel used to carry nested ternaries choosing a title, a confirm label
	 * and a tone. This hook is the only place that knows the count, the action and
	 * the checklist state, so it is where the sentence belongs - and
	 * `buildConfirmCopy` makes the bulk and singular forms correct without either
	 * being typed out.
	 */
	const confirmCopy: {
		title: string;
		description: string;
		confirmLabel: string;
		tone: ConfirmTone;
	} = (() => {
		const { actionType, count, hasUnchecked } = confirmState;
		const action = actionType ?? "delete";

		const base = buildConfirmCopy({
			action,
			// Always tasks: a project is refused before the dialog can open.
			subject: "task",
			count,
			consequence: hasUnchecked
				? UNCHECKED_CONSEQUENCE[action]
				: // Left undefined so the default comes through - for a delete that
					// describes the 30-day trash window rather than claiming the
					// deletion is permanent, which here it is not.
					undefined,
		});

		return { ...base, tone: action === "delete" ? "danger" : "warning" };
	})();

	return {
		selectedIds,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
		confirmState,
		confirmCopy,
		confirmAction,
		closeConfirm,
	};
}
