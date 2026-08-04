import { useState } from "react";
import { useProjectFilters } from "@/app/(dashboard)/hooks/use-project-filters";
import { useProjectStore } from "@/stores/use-project-store";

export function useProjectsClient() {
	const projects = useProjectStore((state) => state.projects);
	const deleteProjects = useProjectStore((state) => state.deleteProjects);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
		new Set(),
	);

	const filters = useProjectFilters(projects);

	// Handlers
	const toggleSelection = (projectId: string) => {
		const newSet = new Set(selectedProjectIds);
		if (newSet.has(projectId)) {
			newSet.delete(projectId);
		} else {
			newSet.add(projectId);
		}
		setSelectedProjectIds(newSet);
	};

	const toggleSelectMode = () => {
		setIsSelectMode((prev) => !prev);
		if (isSelectMode) {
			setSelectedProjectIds(new Set());
		}
	};

	// Opens modal for a single project
	const initiateSingleDelete = (projectId: string) => {
		setProjectToDelete(projectId);
		setIsDeleteModalOpen(true);
	};

	// Opens modal for multiple projects
	const initiateBulkDelete = () => {
		setProjectToDelete(null);
		setIsDeleteModalOpen(true);
	};

	// Deletes the data when the user clicks "Confirm" in the modal
	const confirmDelete = () => {
		if (projectToDelete) {
			// Single Delete
			deleteProjects(new Set([projectToDelete]));
			setProjectToDelete(null);
		} else {
			// Bulk Delete
			deleteProjects(selectedProjectIds);
			setSelectedProjectIds(new Set());
			setIsSelectMode(false);
		}
		setIsDeleteModalOpen(false);
	};

	// Handles if the user clicks "Cancel" on the modal
	const closeDeleteModal = () => {
		setIsDeleteModalOpen(false);
		setProjectToDelete(null);
	};

	return {
		modals: {
			create: { isOpen: isCreateModalOpen, setIsOpen: setIsCreateModalOpen },
			delete: { isOpen: isDeleteModalOpen, close: closeDeleteModal },
		},
		selection: {
			isSelectMode,
			selectedProjectIds,
			toggleSelectMode,
			toggleSelection,
			initiateSingleDelete,
			initiateBulkDelete,
			confirmDelete,
			projectToDelete,
		},
		filters,
	};
}
