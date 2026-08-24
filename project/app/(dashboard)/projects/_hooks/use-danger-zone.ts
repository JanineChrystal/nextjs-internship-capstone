import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
	deleteProjectAction,
	updateProjectAction,
} from "@/lib/actions/project-actions";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import type { RoleAccess } from "@/lib/types/member";
import {
	notify,
	reportActionError,
	reportActionSuccess,
} from "@/lib/utils/toast";
import { useProjectStore } from "@/stores/use-project-store";

interface ArchiveConfirmState {
	isOpen: boolean;
	/** operation mode - fixed flag indicating whether the action is archiving or restoring. */
	isArchiving: boolean;
	/** task dependency flag - true if the project contains unfinished tasks to inform confirmation dialog wording. */
	hasOpenTasks: boolean;
}

const CLOSED: ArchiveConfirmState = {
	isOpen: false,
	isArchiving: true,
	hasOpenTasks: false,
};

export function useDangerZone(projectId: string, currentUserRole: RoleAccess) {
	const router = useRouter();

	// External store
	const projects = useProjectStore((state) => state.projects);
	const updateProject = useProjectStore((state) => state.updateProject);
	const deleteProjects = useProjectStore((state) => state.deleteProjects);

	// Local state
	const [archiveConfirm, setArchiveConfirm] =
		useState<ArchiveConfirmState>(CLOSED);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const project = projects.find((p) => p.id === projectId);

	/**
	 * derived archive state - computes active status directly from the global
	 * project store to prevent local state drift and ensure optimistic updates
	 * immediately reflect in the UI.
	 */
	const isArchiveActive = project?.status === "archived";
	const isOwner = currentUserRole === "owner";

	const hasIncompleteTasks =
		(project?.tasksCount ?? 0) > 0 && (project?.progress ?? 0) < 100;

	// --- Archive -------------------------------------------------------------

	const requestArchiveToggle = useCallback(() => {
		setArchiveConfirm({
			isOpen: true,
			isArchiving: !isArchiveActive,
			hasOpenTasks: hasIncompleteTasks,
		});
	}, [isArchiveActive, hasIncompleteTasks]);

	const closeArchiveConfirm = useCallback(() => setArchiveConfirm(CLOSED), []);

	const confirmArchive = useCallback(async () => {
		const { isArchiving } = archiveConfirm;
		const previousProjects = useProjectStore.getState().projects;

		setArchiveConfirm(CLOSED);
		updateProject(projectId, { status: isArchiving ? "archived" : "active" });

		try {
			const formData = new FormData();
			formData.append("status", isArchiving ? "archived" : "active");

			const result = await updateProjectAction(projectId, formData);
			if (!result?.success) throw new Error(result?.error || "Failed");

			reportActionSuccess(
				isArchiving ? "Project archived" : "Project restored",
			);
		} catch (e) {
			useProjectStore.getState().setProjects(previousProjects);
			reportActionError(
				isArchiving ? "Could not archive project" : "Could not restore project",
				e,
			);
		}
	}, [projectId, archiveConfirm, updateProject]);

	// --- Delete --------------------------------------------------------------

	const handleOpenDeleteModal = useCallback(
		() => setIsDeleteModalOpen(true),
		[],
	);

	/**
	 * execute deletion - performs the actual project deletion API call, keeping the
	 * mutation non-optimistic so the settings page remains intact until the server
	 * successfully processes the request.
	 */
	const handleDeleteProject = useCallback(async () => {
		if (isDeleting) return;
		setIsDeleting(true);

		try {
			const result = await deleteProjectAction(projectId);
			if (!result?.success) throw new Error(result?.error || "Failed");

			deleteProjects(new Set([projectId]));
			setIsDeleteModalOpen(false);
			// recovery reassurance - explicitly informs the user that deleted projects are recoverable from the archive for a retention period.
			notify.success("Project deleted", {
				description: `You can restore it from the archive for ${TRASH_RETENTION_DAYS} days.`,
			});

			// post-deletion navigation - automatically redirects to the projects list since the current settings page now belongs to a deleted project.
			router.push("/projects");
		} catch (e) {
			reportActionError("Could not delete project", e);
		} finally {
			setIsDeleting(false);
		}
	}, [projectId, isDeleting, deleteProjects, router]);

	return {
		isArchiveActive,
		isOwner,
		archiveConfirm,
		hasIncompleteTasks,
		requestArchiveToggle,
		closeArchiveConfirm,
		confirmArchive,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isDeleting,
		handleOpenDeleteModal,
		handleDeleteProject,
	};
}
