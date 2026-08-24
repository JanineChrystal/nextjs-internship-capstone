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

/** action types - defines available bulk actions for calendar selections, explicitly excluding archive since projects cannot be archived from the calendar interface. */
type ActionType = "complete" | "delete";

interface ConfirmState {
	isOpen: boolean;
	actionType: ActionType | null;
	/** pending task count - number of tasks affected by the pending bulk action. */
	count: number;
	/** incomplete checklist flag - true if any selected task contains unfinished checklist items, used to show a warning. */
	hasUnchecked: boolean;
}

const CLOSED: ConfirmState = {
	isOpen: false,
	actionType: null,
	count: 0,
	hasUnchecked: false,
};

/**
 * project action refusal messages - maps actions to explicit rejection messages that guide users to the correct interface for modifying projects.
 */
const PROJECT_REFUSAL: Record<ActionType, string> = {
	delete:
		"Projects cannot be deleted from the calendar. Open the project's Settings > Danger Zone.",
	complete:
		"Projects cannot be completed from the calendar. Open the project and complete it there.",
};

/** incomplete checklist consequences - additional warnings appended to confirmation dialogs when tasks have unfinished checklists. */
const UNCHECKED_CONSEQUENCE: Record<ActionType, string> = {
	delete: `Some still have unchecked checklist items, which go to the trash with them and are deleted permanently after ${TRASH_RETENTION_DAYS} days.`,
	complete:
		"Some still have unchecked checklist items. Completing the task does not tick those off.",
};

// task grouping by project - groups tasks by project id since bulk actions require project-level permission checks on the server.
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
 * calendar selection hook - manages bulk selection and actions for calendar items.
 * enforces rules that bulk actions cannot affect projects (refusing the entire selection if one is present) and always requires confirmation for deletions.
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
		// safety filtering - re-filters tasks independently as a secondary guard to guarantee projects cannot be deleted even if initiation checks fail.
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

		// selective completion confirmation - skips confirmation for reversible completions unless there are incomplete checklist items to warn about.
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

	/** confirmation copy state - dynamically builds grammatically correct confirmation text using context only available in this hook. */
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
			// static subject - always 'task' because projects are rejected upstream.
			subject: "task",
			count,
			consequence: hasUnchecked
				? UNCHECKED_CONSEQUENCE[action]
				: // default consequence - relies on buildConfirmCopy defaults to accurately describe behavior like the 30-day trash retention for deletes.
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
