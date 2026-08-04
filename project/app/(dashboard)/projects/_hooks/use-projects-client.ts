import { useState } from "react";
import { useProjectFilters } from "@/app/(dashboard)/hooks/use-project-filters";
import type { Project } from "@/lib/validations/project-schema";

export function useProjectsClient(initialProjects: Project[]) {
	// Modal States
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Selection States
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
		new Set(),
	);

	// Filter Logic
	const filters = useProjectFilters(initialProjects);

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
			setSelectedProjectIds(new Set()); // Clear selection when exiting mode
		}
	};

	const handleDeleteSelected = () => {
		console.log("Deleting projects:", Array.from(selectedProjectIds));
		// TODO: Hook this to Zustand/API
		setSelectedProjectIds(new Set());
		setIsSelectMode(false);
		setIsDeleteModalOpen(false);
	};

	return {
		modals: {
			create: { isOpen: isCreateModalOpen, setIsOpen: setIsCreateModalOpen },
			delete: { isOpen: isDeleteModalOpen, setIsOpen: setIsDeleteModalOpen },
		},
		selection: {
			isSelectMode,
			selectedProjectIds,
			toggleSelectMode,
			toggleSelection,
			handleDeleteSelected,
		},
		filters,
	};
}
