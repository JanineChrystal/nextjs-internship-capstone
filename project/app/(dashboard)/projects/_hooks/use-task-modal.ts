import * as React from "react";
import { useTaskStore } from "@/stores/use-task-store";
import type { GridTask } from "@/types/task";
import { DEFAULT_TASK_DATA } from "../_constants/task-modal-constants";

export function useTaskModal() {
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

	const isEditMode = !!selectedTaskId;
	const existingTask = tasks.find((t) => t.id === selectedTaskId);

	// Local state for the form
	const [taskData, setTaskData] =
		React.useState<Partial<GridTask>>(DEFAULT_TASK_DATA);
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(true);

	const isInitializedRef = React.useRef(false);

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

	const handleChange = (updates: Partial<GridTask>) => {
		const newData = { ...taskData, ...updates };
		setTaskData(newData);
		if (isEditMode && selectedTaskId) {
			updateTask(selectedTaskId, updates);
		}
	};

	const handleCreate = () => {
		createTask(taskData as Omit<GridTask, "id">);
		closeTaskModal();
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

	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [isAddingLink, setIsAddingLink] = React.useState(false);
	const [linkUrl, setLinkUrl] = React.useState("");

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

	const handleDuplicate = () => {
		if (selectedTaskId) {
			duplicateTask(selectedTaskId);
			closeTaskModal();
		}
	};

	const handleDelete = () => {
		if (selectedTaskId) {
			deleteTask(selectedTaskId);
			closeTaskModal();
		}
	};

	const toggleComments = () => {
		setIsCommentsOpen((prev) => !prev);
	};

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
	};
}
