import { useParams } from "next/navigation";
import * as React from "react";
import {
	createTaskAction,
	deleteTaskAction,
	updateTaskAction,
} from "@/lib/actions/task-actions";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask, TaskModalActionId } from "@/types/task";
import { DEFAULT_TASK_DATA } from "../_constants/task-modal";

export function useTaskModal() {
	const params = useParams();
	const projectId = params?.id as string;

	// External Stores
	const {
		tasks,
		isTaskModalOpen,
		selectedTaskId,
		closeTaskModal,
		createTask,
		updateTask,
		duplicateTask,
		deleteTask,
	} = useTaskStore();

	// Local State & Refs
	const [taskData, setTaskData] =
		React.useState<Partial<GridTask>>(DEFAULT_TASK_DATA);
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(true);
	const [isAddingLink, setIsAddingLink] = React.useState(false);
	const [linkUrl, setLinkUrl] = React.useState("");

	const isInitializedRef = React.useRef(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Derived State
	const isEditMode = !!selectedTaskId;
	const existingTask = tasks.find((t) => t.id === selectedTaskId);

	// Action Handlers
	const handleChange = async (updates: Partial<GridTask>) => {
		const newData = { ...taskData, ...updates };
		setTaskData(newData);
		if (isEditMode && selectedTaskId && projectId) {
			updateTask(selectedTaskId, updates);
			// Fire and forget server action
			await updateTaskAction(selectedTaskId, projectId, updates);
		}
	};

	const handleCreate = async () => {
		const finalData = { ...taskData };
		if (!finalData.name?.trim()) {
			finalData.name = "Untitled Task";
		}

		// Create optimistic ID
		const tempId = crypto.randomUUID();
		const newTask = { ...finalData, id: tempId } as GridTask;
		createTask(newTask);
		closeTaskModal();

		if (projectId) {
			const boardId = finalData.board || "default-board";
			// We should map GridTask -> newDbTask schema fields
			const payload = {
				name: newTask.name,
				category:
					newTask.category || (newTask.category as string) || "Uncategorized",
				status: newTask.status || "Not Started",
				priority: newTask.priority || "medium",
				startDate: newTask.startDate,
				dueDate: newTask.dueDate,
			};
			await createTaskAction(projectId, boardId, payload);
		}
	};

	const addChecklistItem = () => {
		const newItem = { id: crypto.randomUUID(), title: "", completed: false };
		const newChecklist = [...(taskData.checklist || []), newItem];
		handleChange({ checklist: newChecklist });
	};

	const updateChecklistItem = (
		id: string,
		updates: Partial<{ title: string; completed: boolean }>,
	) => {
		const newChecklist = (taskData.checklist || []).map((item) =>
			item.id === id ? { ...item, ...updates } : item,
		);
		handleChange({ checklist: newChecklist });
	};

	const removeChecklistItem = (id: string) => {
		const newChecklist = (taskData.checklist || []).filter(
			(item) => item.id !== id,
		);
		handleChange({ checklist: newChecklist });
	};

	const toggleTaskCompletion = () => {
		handleChange({
			isCompleted: !taskData.isCompleted,
			status: !taskData.isCompleted ? "Completed" : "In Progress",
			board: !taskData.isCompleted ? "Completed" : taskData.board,
		});
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			const newAttachments = Array.from(files).map((f) => ({
				id: crypto.randomUUID(),
				name: f.name,
				url: URL.createObjectURL(f),
			}));
			const updated = [...(taskData.attachments || []), ...newAttachments];
			setTaskData({ ...taskData, attachments: updated });
			if (isEditMode) handleChange({ attachments: updated });
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const removeAttachment = (id: string) => {
		const newAttachments = (taskData.attachments || []).filter(
			(item) => item.id !== id,
		);
		handleChange({ attachments: newAttachments });
	};

	const submitLink = () => {
		if (!linkUrl.trim()) {
			setIsAddingLink(false);
			return;
		}
		const urlStr = linkUrl.trim();
		const newLink = {
			id: crypto.randomUUID(),
			title: urlStr.replace(/^https?:\/\//, "").split("/")[0] || urlStr,
			url: urlStr.startsWith("http") ? urlStr : `https://${urlStr}`,
		};
		const updated = [...(taskData.links || []), newLink];
		setTaskData({ ...taskData, links: updated });
		if (isEditMode) handleChange({ links: updated });
		setLinkUrl("");
		setIsAddingLink(false);
	};

	const removeLink = (id: string) => {
		const newLinks = (taskData.links || []).filter((item) => item.id !== id);
		handleChange({ links: newLinks });
	};

	const handleDuplicate = async () => {
		if (selectedTaskId && projectId) {
			duplicateTask(selectedTaskId);
			closeTaskModal();
			const sourceTask = tasks.find((t) => t.id === selectedTaskId);
			if (sourceTask) {
				const payload = {
					name: `${sourceTask.name} (Copy)`,
					category:
						sourceTask.category ||
						(sourceTask.category as string) ||
						"Uncategorized",
					status: sourceTask.status,
					priority: sourceTask.priority,
				};
				await createTaskAction(projectId, "default-board", payload);
			}
		}
	};

	const handleDelete = async () => {
		if (selectedTaskId && projectId) {
			deleteTask(selectedTaskId);
			closeTaskModal();
			await deleteTaskAction(selectedTaskId, projectId);
		}
	};

	const toggleComments = () => {
		setIsCommentsOpen((prev) => !prev);
	};

	const handleAction = async (
		actionId: TaskModalActionId,
		targetTaskId?: string,
	) => {
		const targetId = targetTaskId || selectedTaskId;
		if (!targetId || !projectId) return;

		switch (actionId) {
			case "TOGGLE_COMPLETION": {
				if (targetTaskId && targetTaskId !== selectedTaskId) {
					const targetTask = tasks.find((t) => t.id === targetTaskId);
					if (targetTask) {
						const updates = {
							isCompleted: !targetTask.isCompleted,
							status: !targetTask.isCompleted ? "Completed" : "In Progress",
							board: !targetTask.isCompleted ? "Completed" : targetTask.board,
						};
						updateTask(targetTaskId, updates);
						await updateTaskAction(targetTaskId, projectId, updates);
					}
				} else {
					toggleTaskCompletion(); // This handles its own handleChange which fires the action
				}
				break;
			}
			case "DUPLICATE":
				if (targetTaskId && targetTaskId !== selectedTaskId) {
					duplicateTask(targetTaskId);
					// replicate duplicate logic here if needed
				} else {
					handleDuplicate();
				}
				break;
			case "DELETE":
				if (targetTaskId && targetTaskId !== selectedTaskId) {
					deleteTask(targetTaskId);
					await deleteTaskAction(targetTaskId, projectId);
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
				// Reset for create mode
				setTaskData({
					...DEFAULT_TASK_DATA,
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
	}, [isTaskModalOpen, isEditMode, existingTask]);

	return {
		isTaskModalOpen,
		closeTaskModal,
		isEditMode,
		taskData,
		setTaskData,
		handleChange,
		handleCreate,
		addChecklistItem,
		updateChecklistItem,
		removeChecklistItem,
		toggleTaskCompletion,
		fileInputRef,
		isAddingLink,
		setIsAddingLink,
		linkUrl,
		setLinkUrl,
		handleFileChange,
		removeAttachment,
		submitLink,
		removeLink,
		handleDuplicate,
		handleDelete,
		isCommentsOpen,
		toggleComments,
		handleAction,
	};
}
