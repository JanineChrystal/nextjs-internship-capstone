import { useParams } from "next/navigation";
import * as React from "react";
import {
	createTaskAction,
	deleteTaskAction,
	updateTaskAction,
} from "@/lib/actions/task-actions";
import { setTaskAssigneesAction } from "@/lib/actions/task-assignee-actions";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskModalActionId } from "@/types/task";
import { DEFAULT_TASK_DATA } from "../_constants/task-modal";
import { useTaskAttachments } from "./use-task-attachments";
import { useTaskChecklist } from "./use-task-checklist";

function toApiDateInput(value: string | undefined): string | undefined {
	return value && value !== "--" ? value : undefined;
}

export function useTaskModal() {
	const params = useParams();
	const projectId = params?.id as string;

	// External Stores
	const {
		tasks,
		isTaskModalOpen,
		selectedTaskId,
		createBoardTitle,
		closeTaskModal,
		createTask,
		updateTask,
		duplicateTask,
		deleteTask,
	} = useTaskStore();

	const { columns } = useBoardStore();

	// Local State & Refs
	const [taskData, setTaskData] =
		React.useState<Partial<GridTask>>(DEFAULT_TASK_DATA);
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(true);
	const [deleteWarning, setDeleteWarning] = React.useState<{
		isOpen: boolean;
		taskName: string;
		onConfirm: (() => void) | null;
	}>({ isOpen: false, taskName: "", onConfirm: null });

	const isInitializedRef = React.useRef(false);

	// Derived State
	const isEditMode = !!selectedTaskId;
	const existingTask = tasks.find((t) => t.id === selectedTaskId);
	const isOverdue = Boolean(
		taskData.dueDate &&
			taskData.dueDate !== "--" &&
			!taskData.isCompleted &&
			new Date(taskData.dueDate) < new Date(),
	);

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
				return;
			}

			const result = await updateTaskAction(selectedTaskId, projectId, {
				name: updates.name,
				status: updates.status,
				priority: updates.priority,
				category: updates.category,
				notes: updates.notes,
				boardId: updates.board ? resolveBoardId(updates.board) : undefined,
				startDate: toApiDateInput(updates.startDate),
				dueDate: toApiDateInput(updates.dueDate),
				isCompleted: updates.isCompleted,
			});
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to update task:", error);
		}
	};

	const handleCreate = async () => {
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
			console.error("Failed to create task: no board available");
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
		} catch (error) {
			deleteTask(tempId);
			console.error("Failed to create task:", error);
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
			console.error("Failed to duplicate task:", error);
		}
	};

	const toggleTaskCompletion = () => {
		handleChange({
			isCompleted: !taskData.isCompleted,
			status: !taskData.isCompleted ? "Completed" : "In Progress",
			board: !taskData.isCompleted ? "Completed" : taskData.board,
		});
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
			console.error("Failed to delete task:", error);
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
		const updates = {
			isCompleted: !targetTask.isCompleted,
			status: !targetTask.isCompleted ? "Completed" : "In Progress",
			board: !targetTask.isCompleted ? "Completed" : targetTask.board,
		};
		updateTask(targetTaskId, updates);
		try {
			const result = await updateTaskAction(targetTaskId, projectId, {
				status: updates.status,
				isCompleted: updates.isCompleted,
				boardId: resolveBoardId(updates.board),
			});
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to toggle task completion:", error);
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
			console.error("Failed to delete task:", error);
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
			if (isEditMode && existingTask) {
				setTaskData(existingTask);
			} else {
				// Reset for create mode. Prefer the board the modal was opened
				// from (e.g. a column's "Add Tasks" button), falling back to
				// the project's first real board rather than a hardcoded
				// default that may not exist for this project.
				const initialBoard = createBoardTitle || columns[0]?.title || "";
				setTaskData({
					...DEFAULT_TASK_DATA,
					board: initialBoard,
					status: initialBoard,
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
	}, [isTaskModalOpen, isEditMode, existingTask, createBoardTitle, columns]);

	return {
		projectId,
		selectedTaskId,
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		isOverdue,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
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
