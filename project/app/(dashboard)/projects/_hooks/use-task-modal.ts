import { useParams } from "next/navigation";
import * as React from "react";
import { applyArchiveOperationAction } from "@/lib/actions/archive-actions";
import {
	createTaskAction,
	deleteTaskAction,
	updateTaskAction,
} from "@/lib/actions/task-actions";
import { setTaskAssigneesAction } from "@/lib/actions/task-assignee-actions";
import type { GridTask, TaskModalActionId } from "@/lib/types/task";
import { toApiDateInput } from "@/lib/utils/date";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import {
	deriveTaskStatus,
	TASK_STATUS_COMPLETED,
	TASK_STATUS_IN_PROGRESS,
	TASK_STATUS_NOT_STARTED,
} from "@/lib/utils/task-status";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { validateSchedule } from "@/lib/validations/date-rules";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import { DEFAULT_TASK_DATA } from "../_constants/task-modal";
import { useTaskAttachments } from "./use-task-attachments";
import { useTaskChecklist } from "./use-task-checklist";

export function useTaskModal() {
	const params = useParams();

	// External Stores
	const {
		tasks,
		isTaskModalOpen,
		selectedTaskId,
		createBoardTitle,
		createDate,
		closeTaskModal,
		createTask,
		updateTask,
		duplicateTask,
		deleteTask,
		createProjectId,
	} = useTaskStore();

	// The route wins when there is one, because every in-project opener is
	// already under /projects/[id] and that is the authoritative answer there.
	// createProjectId only carries a value when the modal was opened from
	// somewhere with no project in its URL - today, the dashboard shortcut.
	const projectId = (params?.id as string) ?? createProjectId ?? "";

	const { columns } = useBoardStore();

	// Local State & Refs
	const [taskData, setTaskData] =
		React.useState<Partial<GridTask>>(DEFAULT_TASK_DATA);
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(true);
	const [scheduleError, setScheduleError] = React.useState<string | null>(null);
	const [deleteWarning, setDeleteWarning] = React.useState<{
		isOpen: boolean;
		taskName: string;
		onConfirm: (() => void) | null;
	}>({ isOpen: false, taskName: "", onConfirm: null });

	const isInitializedRef = React.useRef(false);
	// Tracks a manual status pick made during this modal session, so the badge
	// stops showing "Overdue" as soon as the user chooses something else.
	const statusOverriddenAtRef = React.useRef<Date | null>(null);

	// Derived State
	const isEditMode = !!selectedTaskId;
	const existingTask = tasks.find((t) => t.id === selectedTaskId);
	const isOverdue = Boolean(
		taskData.dueDate &&
			taskData.dueDate !== "--" &&
			!taskData.isCompleted &&
			new Date(taskData.dueDate) < new Date(),
	);

	// What the status badge beside the title shows. Overdue outranks the stored
	// status unless the user has picked one since the task lapsed.
	const displayStatus = deriveTaskStatus({
		isCompleted: Boolean(taskData.isCompleted),
		status: taskData.storedStatus || taskData.status || TASK_STATUS_NOT_STARTED,
		dueDate:
			taskData.dueDate && taskData.dueDate !== "--"
				? new Date(taskData.dueDate)
				: null,
		statusOverriddenAt: statusOverriddenAtRef.current,
	});

	const resolveBoardId = (boardTitle: string | undefined): string | undefined =>
		columns.find((c) => c.title === boardTitle)?.id || columns[0]?.id;

	// Composed Sub-Hooks
	const checklist = useTaskChecklist({
		taskData,
		setTaskData,
		isEditMode,
		selectedTaskId,
		projectId,
	});
	const attachments = useTaskAttachments({
		taskData,
		setTaskData,
		isEditMode,
		selectedTaskId,
		projectId,
	});

	// Action Handlers
	const handleChange = async (updates: Partial<GridTask>) => {
		const newData = { ...taskData, ...updates };

		const touchesSchedule =
			updates.startDate !== undefined || updates.dueDate !== undefined;
		if (touchesSchedule) {
			const error = validateSchedule(newData, updates);
			setScheduleError(error);
			// Reject the change outright so an invalid range is never shown
			// as accepted, let alone persisted.
			if (error) return;
		}

		setTaskData(newData);
		if (!isEditMode || !selectedTaskId || !projectId) return;

		// Checklist/attachments/links are persisted through their own dedicated
		// handlers, not through the generic field update action.
		if (updates.checklist || updates.attachments || updates.links) return;

		const previousTasks = useTaskStore.getState().tasks;
		updateTask(selectedTaskId, updates);

		try {
			if (updates.assignees) {
				const result = await setTaskAssigneesAction(
					selectedTaskId,
					projectId,
					updates.assignees.map((a) => a.userId),
				);
				if (!result.success) throw new Error(result.error);
				reportActionSuccess("Assignees updated");
				return;
			}

			const extras = updates as Partial<GridTask> & {
				statusOverriddenAt?: string;
				previousBoardId?: string | null;
			};

			const result = await updateTaskAction(selectedTaskId, projectId, {
				name: updates.name,
				status: updates.status,
				priority: updates.priority,
				category: updates.category,
				notes: updates.notes,
				boardId: updates.board ? resolveBoardId(updates.board) : undefined,
				previousBoardId: extras.previousBoardId,
				startDate: toApiDateInput(updates.startDate),
				dueDate: toApiDateInput(updates.dueDate),
				isCompleted: updates.isCompleted,
				statusOverriddenAt: extras.statusOverriddenAt,
			});
			if (!result.success) throw new Error(result.error);

			// Only completion gets a toast on this path. Every other field here is a
			// routine inline edit where the input visibly changing IS the feedback -
			// toasting each one would fire several times during normal editing.
			if (updates.isCompleted !== undefined) {
				reportActionSuccess(
					updates.isCompleted ? "Task marked complete" : "Task reopened",
				);
			}
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not update task", error);
		}
	};

	const handleCreate = async () => {
		const blockingError = validateSchedule(taskData, {
			startDate: taskData.startDate,
			dueDate: taskData.dueDate,
		});
		if (blockingError) {
			setScheduleError(blockingError);
			return;
		}

		const finalData = { ...taskData };
		if (!finalData.name?.trim()) {
			finalData.name = "Untitled Task";
		}

		const tempId = crypto.randomUUID();
		const newTask = {
			...DEFAULT_TASK_DATA,
			...finalData,
			id: tempId,
			projectId,
		} as GridTask;
		createTask(newTask);
		closeTaskModal();

		if (!projectId) return;

		const boardId = resolveBoardId(finalData.board);
		if (!boardId) {
			deleteTask(tempId);
			reportActionError(
				"Could not create task",
				"This project has no board column to place it in.",
			);
			return;
		}

		try {
			const payload = {
				name: newTask.name,
				category: newTask.category || "Uncategorized",
				status: newTask.status || "Not Started",
				priority: newTask.priority || "medium",
				notes: newTask.notes,
				startDate: toApiDateInput(newTask.startDate),
				dueDate: toApiDateInput(newTask.dueDate),
			};
			const result = await createTaskAction(projectId, boardId, payload);
			if (!result.success || !result.data) throw new Error(result.error);

			updateTask(tempId, { id: result.data.id });
			reportActionSuccess("Task created");
		} catch (error) {
			deleteTask(tempId);
			reportActionError("Could not create task", error);
		}
	};

	const duplicateOnServer = async (sourceTask: GridTask, newTaskId: string) => {
		try {
			const boardId = resolveBoardId(sourceTask.board);
			if (!boardId) throw new Error("No board available");

			const payload = {
				name: `${sourceTask.name} (Copy)`,
				category: sourceTask.category || "Uncategorized",
				status: sourceTask.status,
				priority: sourceTask.priority,
				notes: sourceTask.notes,
			};
			const result = await createTaskAction(projectId, boardId, payload);
			if (!result.success || !result.data) throw new Error(result.error);

			updateTask(newTaskId, { id: result.data.id, name: payload.name });
		} catch (error) {
			deleteTask(newTaskId);
			reportActionError("Could not duplicate task", error);
		}
	};

	// Completion is recorded on the task itself. Moving it into the designated
	// completion column is a best-effort extra: when the project has not
	// designated one (or it was deleted), the task stays in its current column
	// and is simply flagged complete.
	const buildCompletionUpdates = (
		current: Partial<GridTask>,
	): Partial<GridTask> & { previousBoardId?: string | null } => {
		const nextCompleted = !current.isCompleted;

		if (!nextCompleted) {
			// Un-completing returns the task to wherever it was moved from, as
			// long as that column still exists.
			const previousBoard = current.previousBoardId
				? columns.find((col) => col.id === current.previousBoardId)
				: undefined;

			return {
				isCompleted: false,
				status: TASK_STATUS_IN_PROGRESS,
				previousBoardId: null,
				...(previousBoard ? { board: previousBoard.title } : {}),
			};
		}

		const completionColumn = columns.find((col) => col.isCompletionBoard);
		const currentBoardId = columns.find(
			(col) => col.title === current.board,
		)?.id;

		if (!completionColumn || completionColumn.id === currentBoardId) {
			return { isCompleted: true, status: TASK_STATUS_COMPLETED };
		}

		return {
			isCompleted: true,
			status: TASK_STATUS_COMPLETED,
			board: completionColumn.title,
			// Remembered so un-completing can undo the move.
			previousBoardId: currentBoardId ?? null,
		};
	};

	const toggleTaskCompletion = () => {
		statusOverriddenAtRef.current = new Date();
		handleChange(buildCompletionUpdates(taskData));
	};

	/**
	 * A hand-picked status. Stamping the override time is what stops an already
	 * lapsed due date from immediately forcing the badge back to "Overdue" -
	 * while leaving the past-due notice visible until the date itself is moved.
	 */
	const handleStatusChange = (nextStatus: string) => {
		const overriddenAt = new Date();
		statusOverriddenAtRef.current = overriddenAt;

		handleChange({
			status: nextStatus,
			storedStatus: nextStatus,
			isCompleted: nextStatus === TASK_STATUS_COMPLETED,
			statusOverriddenAt: overriddenAt.toISOString(),
		} as Partial<GridTask>);
	};

	const handleDuplicate = async () => {
		if (!selectedTaskId || !projectId) return;
		const sourceTask = tasks.find((t) => t.id === selectedTaskId);
		if (!sourceTask) return;

		const newTaskId = duplicateTask(selectedTaskId);
		closeTaskModal();
		if (!newTaskId) return;

		await duplicateOnServer(sourceTask, newTaskId);
	};

	const executeDeleteSelf = async () => {
		if (!selectedTaskId || !projectId) return;
		const previousTasks = useTaskStore.getState().tasks;

		deleteTask(selectedTaskId);
		closeTaskModal();

		try {
			const result = await deleteTaskAction(selectedTaskId, projectId);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not delete task", error);
		}
	};

	const handleDelete = () => {
		if (!selectedTaskId) return;
		const task = tasks.find((t) => t.id === selectedTaskId);
		if (task && hasIncompleteChecklist(task)) {
			setDeleteWarning({
				isOpen: true,
				taskName: task.name,
				onConfirm: executeDeleteSelf,
			});
		} else {
			executeDeleteSelf();
		}
	};

	const toggleComments = () => {
		setIsCommentsOpen((prev) => !prev);
	};

	const confirmDeleteWarning = () => {
		deleteWarning.onConfirm?.();
		setDeleteWarning({ isOpen: false, taskName: "", onConfirm: null });
	};

	const closeDeleteWarning = () =>
		setDeleteWarning({ isOpen: false, taskName: "", onConfirm: null });

	const toggleOtherTaskCompletion = async (targetTaskId: string) => {
		const targetTask = tasks.find((t) => t.id === targetTaskId);
		if (!targetTask) return;
		const previousTasks = useTaskStore.getState().tasks;
		const updates = buildCompletionUpdates(targetTask);
		updateTask(targetTaskId, updates);
		try {
			const result = await updateTaskAction(targetTaskId, projectId, {
				status: updates.status,
				isCompleted: updates.isCompleted,
				boardId: updates.board ? resolveBoardId(updates.board) : undefined,
			});
			if (!result.success) throw new Error(result.error);
			reportActionSuccess(
				updates.isCompleted ? "Task marked complete" : "Task reopened",
			);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not update task completion", error);
		}
	};

	const executeDeleteOther = async (targetTaskId: string) => {
		const previousTasks = useTaskStore.getState().tasks;
		deleteTask(targetTaskId);
		try {
			const result = await deleteTaskAction(targetTaskId, projectId);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			reportActionError("Could not delete task", error);
		}
	};

	const deleteOtherTask = (targetTaskId: string) => {
		const task = tasks.find((t) => t.id === targetTaskId);
		if (task && hasIncompleteChecklist(task)) {
			setDeleteWarning({
				isOpen: true,
				taskName: task.name,
				onConfirm: () => executeDeleteOther(targetTaskId),
			});
		} else {
			executeDeleteOther(targetTaskId);
		}
	};

	const handleAction = async (
		actionId: TaskModalActionId,
		targetTaskId?: string,
	) => {
		const targetId = targetTaskId || selectedTaskId;
		if (!targetId || !projectId) return;
		const isOtherTask = targetTaskId && targetTaskId !== selectedTaskId;

		switch (actionId) {
			case "TOGGLE_COMPLETION":
				if (isOtherTask) {
					await toggleOtherTaskCompletion(targetId);
				} else {
					toggleTaskCompletion();
				}
				break;
			case "DUPLICATE":
				if (isOtherTask) {
					const sourceTask = tasks.find((t) => t.id === targetId);
					if (!sourceTask) return;
					const newTaskId = duplicateTask(targetId);
					if (!newTaskId) return;
					await duplicateOnServer(sourceTask, newTaskId);
				} else {
					handleDuplicate();
				}
				break;
			case "ARCHIVE": {
				// Removed from the board immediately, then archived on the server.
				// The task store has no "archived" state of its own - to every screen
				// except /archive, an archived task is simply gone - so dropping it
				// from the store is the correct optimistic update, not a shortcut.
				const archiveResult = await applyArchiveOperationAction(
					"task",
					targetId,
					"archive",
				);

				if (!archiveResult.success) {
					reportActionError("Could not archive task", archiveResult.error);
					break;
				}

				deleteTask(targetId);
				if (!isOtherTask) closeTaskModal();
				reportActionSuccess("Task archived");
				break;
			}
			case "DELETE":
				if (isOtherTask) {
					deleteOtherTask(targetId);
				} else {
					handleDelete();
				}
				break;
		}
	};

	// Effects
	React.useEffect(() => {
		if (isTaskModalOpen && !isInitializedRef.current) {
			isInitializedRef.current = true;
			setScheduleError(null);
			// Start from "no override this session"; the derived status then
			// reflects whatever the server already decided.
			statusOverriddenAtRef.current = null;
			if (isEditMode && existingTask) {
				setTaskData(existingTask);
			} else {
				// Reset for create mode. Prefer the board the modal was opened
				// from (e.g. a column's "Add Tasks" button), falling back to
				// the project's first real board rather than a hardcoded
				// default that may not exist for this project.
				const initialBoard = createBoardTitle || columns[0]?.title || "";

				// If opened from a calendar date click, prefill both dates with
				// the clicked day merged with the current time-of-day, rather
				// than leaving them unset.
				let prefillDate = DEFAULT_TASK_DATA.dueDate;
				if (createDate) {
					const now = new Date();
					const merged = new Date(createDate);
					merged.setHours(now.getHours(), now.getMinutes(), 0, 0);
					prefillDate = merged.toISOString();
				}

				setTaskData({
					...DEFAULT_TASK_DATA,
					// Seeded so the properties grid can scope its category list
					// without a route param. It already prefers the task's own
					// project over the URL; in create mode there was simply no
					// task yet to read it from.
					projectId,
					board: initialBoard,
					status: TASK_STATUS_NOT_STARTED,
					startDate: prefillDate,
					dueDate: prefillDate,
					assignees: [],
					checklist: [],
					attachments: [],
					links: [],
				});
			}
		}

		if (!isTaskModalOpen) {
			isInitializedRef.current = false;
		}
	}, [
		isTaskModalOpen,
		isEditMode,
		existingTask,
		createBoardTitle,
		createDate,
		columns,
		projectId,
	]);

	return {
		projectId,
		selectedTaskId,
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		isOverdue,
		displayStatus,
		handleStatusChange,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
		scheduleError,
		...checklist,
		toggleTaskCompletion,
		...attachments,
		handleDuplicate,
		handleDelete,
		deleteWarning,
		confirmDeleteWarning,
		closeDeleteWarning,
		isCommentsOpen,
		toggleComments,
		handleAction,
	};
}
