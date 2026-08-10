import { useCallback, useState } from "react";
import type { RoleAccess } from "@/types/member";

export function useDangerZone(projectId: string, currentUserRole: RoleAccess) {
	// Local state
	const [isArchiveActive, setIsArchiveActive] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Derived state
	const isOwner = currentUserRole === "owner";

	// Handlers
	const handleToggleArchive = useCallback(() => {
		setIsArchiveActive((prev) => !prev);
	}, []);

	const handleOpenDeleteModal = useCallback(() => {
		setIsDeleteModalOpen(true);
	}, []);

	const handleDeleteProject = useCallback(() => {
		// Mock action
		alert(`Project ${projectId} deleted successfully.`);
	}, [projectId]);

	return {
		isArchiveActive,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isOwner,
		handleToggleArchive,
		handleOpenDeleteModal,
		handleDeleteProject,
	};
}
