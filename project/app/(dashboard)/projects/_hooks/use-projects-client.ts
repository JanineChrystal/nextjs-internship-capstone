import { useCallback, useEffect, useState } from "react";
import { useProjectFilters } from "@/app/(dashboard)/_hooks/use-project-filters";
import {
	bulkArchiveProjectsAction,
	bulkCompleteProjectsAction,
	bulkDeleteProjectsAction,
	deleteProjectAction,
} from "@/lib/actions/project-actions";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectStore } from "@/stores/use-project-store";

export function useProjectsClient(initialProjects: Project[]) {
	// External Stores
	const projects = useProjectStore((state) => state.projects);
	const deleteProjects = useProjectStore((state) => state.deleteProjects);
	const updateProject = useProjectStore((state) => state.updateProject);
	const setProjects = useProjectStore((state) => state.setProjects);

	// Local State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
		new Set(),
	);
	const [warningModal, setWarningModal] = useState<{
		isOpen: boolean;
		actionType: "complete" | "archive" | "delete" | null;
	}>({ isOpen: false, actionType: null });

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

	const clearSelection = () => {
		setSelectedProjectIds(new Set());
		setIsSelectMode(false);
	};

	const toggleSelectMode = () => {
		setIsSelectMode((prev) => !prev);
		if (isSelectMode) {
			setSelectedProjectIds(new Set());
		}
	};

	const checkHasIncompleteTasks = useCallback(
		(ids: string[]) => {
			return projects.some(
				(p) =>
					ids.includes(p.id) &&
					(p.tasksCount ?? 0) > 0 &&
					(p.progress ?? 0) < 100,
			);
		},
		[projects],
	);

	const initiateSingleDelete = (projectId: string) => {
		setProjectToDelete(projectId);
		if (checkHasIncompleteTasks([projectId])) {
			setWarningModal({ isOpen: true, actionType: "delete" });
		} else {
			setIsDeleteModalOpen(true);
		}
	};

	const initiateBulkDelete = () => {
		setProjectToDelete(null);
		if (checkHasIncompleteTasks(Array.from(selectedProjectIds))) {
			setWarningModal({ isOpen: true, actionType: "delete" });
		} else {
			setIsDeleteModalOpen(true);
		}
	};

	const confirmDelete = async () => {
		const previousProjects = useProjectStore.getState().projects;

		if (projectToDelete) {
			deleteProjects(new Set([projectToDelete]));
			setIsDeleteModalOpen(false);

			try {
				const result = await deleteProjectAction(projectToDelete);
				if (!result?.success) throw new Error(result?.error || "Failed");
			} catch (e) {
				useProjectStore.getState().setProjects(previousProjects);
				console.error("Failed to delete project:", e);
			}
			setProjectToDelete(null);
		} else {
			deleteProjects(selectedProjectIds);
			setIsDeleteModalOpen(false);

			try {
				const result = await bulkDeleteProjectsAction(
					Array.from(selectedProjectIds),
				);
				if (!result?.success) throw new Error(result?.error || "Failed");
			} catch (e) {
				useProjectStore.getState().setProjects(previousProjects);
				console.error("Failed to bulk delete projects:", e);
			}
			setSelectedProjectIds(new Set());
			setIsSelectMode(false);
		}
	};

	const confirmArchive = async () => {
		if (selectedProjectIds.size > 0) {
			const previousProjects = useProjectStore.getState().projects;
			const ids = Array.from(selectedProjectIds);

			ids.forEach((id) => {
				updateProject(id, { status: "archived" });
			});

			setSelectedProjectIds(new Set());
			setIsSelectMode(false);

			try {
				const result = await bulkArchiveProjectsAction(ids);
				if (!result?.success) throw new Error(result?.error || "Failed");
			} catch (e) {
				useProjectStore.getState().setProjects(previousProjects);
				console.error("Failed to bulk archive projects:", e);
			}
		}
	};

	const initiateBulkArchive = () => {
		if (checkHasIncompleteTasks(Array.from(selectedProjectIds))) {
			setWarningModal({ isOpen: true, actionType: "archive" });
		} else {
			confirmArchive();
		}
	};

	const confirmComplete = async () => {
		if (selectedProjectIds.size > 0) {
			const previousProjects = useProjectStore.getState().projects;
			const ids = Array.from(selectedProjectIds);

			ids.forEach((id) => {
				updateProject(id, { status: "completed" });
			});

			setSelectedProjectIds(new Set());
			setIsSelectMode(false);

			try {
				const result = await bulkCompleteProjectsAction(ids);
				if (!result?.success) throw new Error(result?.error || "Failed");
			} catch (e) {
				useProjectStore.getState().setProjects(previousProjects);
				console.error("Failed to bulk complete projects:", e);
			}
		}
	};

	const initiateBulkComplete = () => {
		if (checkHasIncompleteTasks(Array.from(selectedProjectIds))) {
			setWarningModal({ isOpen: true, actionType: "complete" });
		} else {
			confirmComplete();
		}
	};

	const confirmWarningAction = () => {
		switch (warningModal.actionType) {
			case "delete":
				setIsDeleteModalOpen(true);
				break;
			case "archive":
				confirmArchive();
				break;
			case "complete":
				confirmComplete();
				break;
		}
		setWarningModal({ isOpen: false, actionType: null });
	};

	const closeDeleteModal = () => {
		setIsDeleteModalOpen(false);
		setProjectToDelete(null);
	};

	// Effects
	useEffect(() => {
		setProjects(initialProjects ?? []);
	}, [initialProjects, setProjects]);

	return {
		modals: {
			create: { isOpen: isCreateModalOpen, setIsOpen: setIsCreateModalOpen },
			delete: { isOpen: isDeleteModalOpen, close: closeDeleteModal },
			warning: {
				...warningModal,
				close: () => setWarningModal({ isOpen: false, actionType: null }),
				confirm: confirmWarningAction,
			},
		},
		selection: {
			isSelectMode,
			selectedProjectIds,
			toggleSelectMode,
			clearSelection,
			toggleSelection,
			initiateSingleDelete,
			initiateBulkDelete,
			initiateBulkArchive,
			initiateBulkComplete,
			confirmDelete,
			projectToDelete,
		},
		filters,
	};
}
