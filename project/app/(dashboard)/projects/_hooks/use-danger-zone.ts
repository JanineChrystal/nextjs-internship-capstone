import { useCallback, useState } from "react";
import { updateProjectAction } from "@/lib/actions/project-actions";
import { useProjectStore } from "@/stores/use-project-store";
import type { RoleAccess } from "@/types/member";

export function useDangerZone(projectId: string, currentUserRole: RoleAccess) {
	// Local state
	const [isArchiveActive, setIsArchiveActive] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [warningModal, setWarningModal] = useState<{
		isOpen: boolean;
		actionType: "archive" | "delete" | null;
	}>({ isOpen: false, actionType: null });

	// Derived state
	const isOwner = currentUserRole === "owner";
	const projects = useProjectStore((state) => state.projects);
	const updateProject = useProjectStore((state) => state.updateProject);

	const checkHasIncompleteTasks = useCallback(() => {
		return projects.some(
			(p) =>
				p.id === projectId &&
				(p.tasksCount ?? 0) > 0 &&
				(p.progress ?? 0) < 100,
		);
	}, [projects, projectId]);

	// Handlers
	const confirmArchive = useCallback(async () => {
		const previousProjects = useProjectStore.getState().projects;
		updateProject(projectId, {
			status: isArchiveActive ? "active" : "archived",
		});
		setIsArchiveActive((prev) => !prev);
		setWarningModal({ isOpen: false, actionType: null });

		try {
			const formData = new FormData();
			formData.append("status", isArchiveActive ? "active" : "archived");

			const result = await updateProjectAction(projectId, formData);
			if (!result?.success) throw new Error(result?.error || "Failed");
		} catch (e) {
			useProjectStore.getState().setProjects(previousProjects);
			setIsArchiveActive((prev) => !prev);
			console.error("Failed to archive project:", e);
		}
	}, [projectId, isArchiveActive, updateProject]);

	const handleToggleArchive = useCallback(() => {
		if (!isArchiveActive && checkHasIncompleteTasks()) {
			setWarningModal({ isOpen: true, actionType: "archive" });
		} else {
			confirmArchive();
		}
	}, [isArchiveActive, checkHasIncompleteTasks, confirmArchive]);

	const handleOpenDeleteModal = useCallback(() => {
		if (checkHasIncompleteTasks()) {
			setWarningModal({ isOpen: true, actionType: "delete" });
		} else {
			setIsDeleteModalOpen(true);
		}
	}, [checkHasIncompleteTasks]);

	const handleDeleteProject = useCallback(() => {
		// Mock action
		alert(`Project ${projectId} deleted successfully.`);
		setIsDeleteModalOpen(false);
	}, [projectId]);

	const confirmWarningAction = useCallback(() => {
		if (warningModal.actionType === "delete") {
			setIsDeleteModalOpen(true);
			setWarningModal({ isOpen: false, actionType: null });
		} else if (warningModal.actionType === "archive") {
			confirmArchive();
		}
	}, [warningModal.actionType, confirmArchive]);

	return {
		isArchiveActive,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		warningModal,
		setWarningModal,
		confirmWarningAction,
		isOwner,
		handleToggleArchive,
		handleOpenDeleteModal,
		handleDeleteProject,
	};
}
