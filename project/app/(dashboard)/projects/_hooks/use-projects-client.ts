import { useEffect, useState } from "react";
import { useProjectFilters } from "@/app/(dashboard)/_hooks/use-project-filters";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

export function useProjectsClient(initialProjects: Project[]) {
	// External Stores
	const projects = useProjectStore((state) => state.projects);
	const deleteProjects = useProjectStore((state) => state.deleteProjects);
	const setProjects = useProjectStore((state) => state.setProjects);

	// Local State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
		new Set(),
	);

	// Derived State & Hooks
	const filters = useProjectFilters(projects);

	// Action Handlers
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

	const initiateSingleDelete = (projectId: string) => {
		setProjectToDelete(projectId);
		setIsDeleteModalOpen(true);
	};

	const initiateBulkDelete = () => {
		setProjectToDelete(null);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = () => {
		if (projectToDelete) {
			deleteProjects(new Set([projectToDelete]));
			setProjectToDelete(null);
		} else {
			deleteProjects(selectedProjectIds);
			setSelectedProjectIds(new Set());
			setIsSelectMode(false);
		}
		setIsDeleteModalOpen(false);
	};

	const closeDeleteModal = () => {
		setIsDeleteModalOpen(false);
		setProjectToDelete(null);
	};

	// Effects
	useEffect(() => {
		if (initialProjects && initialProjects.length > 0) {
			setProjects(initialProjects);
		}
	}, [initialProjects, setProjects]);

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
