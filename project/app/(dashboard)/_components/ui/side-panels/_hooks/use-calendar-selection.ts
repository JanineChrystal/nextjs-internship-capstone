import { useState } from "react";
import {
	bulkArchiveProjectsAction,
	bulkCompleteProjectsAction,
	bulkDeleteProjectsAction,
} from "@/lib/actions/project-actions";
import {
	bulkCompleteTasksAction,
	bulkDeleteTasksAction,
} from "@/lib/actions/task-actions";
import { hasIncompleteChecklist } from "@/lib/utils/task";
import { useProjectStore } from "@/stores/use-project-store";
import { useTaskStore } from "@/stores/use-task-store";
import type { CalendarDeadlineItem } from "@/types/calendar";

type ActionType = "complete" | "archive" | "delete";

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

export function useCalendarSelection(items: CalendarDeadlineItem[]) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [alertMessage, setAlertMessage] = useState<string | null>(null);
	const [warningModal, setWarningModal] = useState<{
		isOpen: boolean;
		actionType: ActionType | null;
	}>({ isOpen: false, actionType: null });

	const tasks = useTaskStore((s) => s.tasks);
	const bulkDeleteTasksInStore = useTaskStore((s) => s.bulkDeleteTasks);
	const bulkCompleteTasksInStore = useTaskStore((s) => s.bulkCompleteTasks);
	const projects = useProjectStore((s) => s.projects);
	const deleteProjectsInStore = useProjectStore((s) => s.deleteProjects);
	const updateProjectInStore = useProjectStore((s) => s.updateProject);

	const handleToggleSelect = (item: CalendarDeadlineItem) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(item.id)) {
			newSelected.delete(item.id);
		} else {
			newSelected.add(item.id);
		}
		setSelectedIds(newSelected);
		setAlertMessage(null);
	};

	const handleClearSelection = () => {
		setSelectedIds(new Set());
		setAlertMessage(null);
	};

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

	const hasUnsafeSelection = (projectIds: string[], taskIds: string[]) => {
		const hasIncompleteProject = projects.some(
			(p) =>
				projectIds.includes(p.id) &&
				(p.tasksCount ?? 0) > 0 &&
				(p.progress ?? 0) < 100,
		);
		const hasIncompleteTask = tasks.some(
			(t) => taskIds.includes(t.id) && hasIncompleteChecklist(t),
		);
		return hasIncompleteProject || hasIncompleteTask;
	};

	const executeComplete = async () => {
		const { projectIds, taskIds } = getSelectedByType();
		const previousProjects = useProjectStore.getState().projects;
		const previousTasks = useTaskStore.getState().tasks;

		for (const id of projectIds)
			updateProjectInStore(id, { status: "completed" });
		if (taskIds.length > 0) bulkCompleteTasksInStore(new Set(taskIds));
		handleClearSelection();

		try {
			const taskGroups = groupTaskIdsByProject(taskIds, tasks);
			await Promise.all([
				...(projectIds.length ? [bulkCompleteProjectsAction(projectIds)] : []),
				...Object.entries(taskGroups).map(([projectId, ids]) =>
					bulkCompleteTasksAction(ids, projectId),
				),
			]);
		} catch (error) {
			useProjectStore.getState().setProjects(previousProjects);
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to bulk complete:", error);
		}
	};

	const executeArchive = async () => {
		const { projectIds } = getSelectedByType();
		if (projectIds.length === 0) {
			handleClearSelection();
			return;
		}
		const previousProjects = useProjectStore.getState().projects;
		for (const id of projectIds)
			updateProjectInStore(id, { status: "archived" });
		handleClearSelection();

		try {
			const result = await bulkArchiveProjectsAction(projectIds);
			if (!result.success) throw new Error(result.error);
		} catch (error) {
			useProjectStore.getState().setProjects(previousProjects);
			console.error("Failed to bulk archive:", error);
		}
	};

	const executeDelete = async () => {
		const { projectIds, taskIds } = getSelectedByType();
		const previousProjects = useProjectStore.getState().projects;
		const previousTasks = useTaskStore.getState().tasks;

		if (projectIds.length > 0) deleteProjectsInStore(new Set(projectIds));
		if (taskIds.length > 0) bulkDeleteTasksInStore(new Set(taskIds));
		handleClearSelection();

		try {
			const taskGroups = groupTaskIdsByProject(taskIds, tasks);
			await Promise.all([
				...(projectIds.length ? [bulkDeleteProjectsAction(projectIds)] : []),
				...Object.entries(taskGroups).map(([projectId, ids]) =>
					bulkDeleteTasksAction(ids, projectId),
				),
			]);
		} catch (error) {
			useProjectStore.getState().setProjects(previousProjects);
			useTaskStore.getState().setTasks(previousTasks);
			console.error("Failed to bulk delete:", error);
		}
	};

	const initiateAction = (actionType: ActionType) => {
		const { projectIds, taskIds } = getSelectedByType();
		if (hasUnsafeSelection(projectIds, taskIds)) {
			setWarningModal({ isOpen: true, actionType });
			return;
		}
		if (actionType === "complete") executeComplete();
		if (actionType === "archive") executeArchive();
		if (actionType === "delete") executeDelete();
	};

	const handleBulkComplete = () => initiateAction("complete");
	const handleBulkArchive = () => initiateAction("archive");
	const handleBulkDelete = () => initiateAction("delete");

	const confirmWarningAction = () => {
		if (warningModal.actionType === "complete") executeComplete();
		if (warningModal.actionType === "archive") executeArchive();
		if (warningModal.actionType === "delete") executeDelete();
		setWarningModal({ isOpen: false, actionType: null });
	};

	const closeWarningModal = () =>
		setWarningModal({ isOpen: false, actionType: null });

	return {
		selectedIds,
		alertMessage,
		setAlertMessage,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
		handleBulkArchive,
		warningModal,
		confirmWarningAction,
		closeWarningModal,
	};
}
