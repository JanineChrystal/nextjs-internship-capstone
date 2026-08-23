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
	/** True when archiving, false when restoring. Fixed when the dialog opens. */
	isArchiving: boolean;
	/** Whether the project still has unfinished tasks, for the wording. */
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
	 * Read from the store rather than held in local state.
	 *
	 * This used to be `useState(false)`, initialised to "not archived" no matter
	 * what the project actually was - so opening the settings of an already
	 * archived project offered to archive it again, and the button label was
	 * simply wrong. Deriving it means the optimistic `updateProject` below is the
	 * only thing that has to flip, and the label cannot fall out of step with the
	 * data it describes.
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
	 * Deletes the project for real.
	 *
	 * This was a mock - a `window.alert` claiming success while nothing was
	 * deleted - so the whole Danger Zone looked functional and was not.
	 *
	 * Unlike every other mutation here it is NOT optimistic. An optimistic delete
	 * would remove the project from the store while we are still standing on its
	 * settings page, blanking the surface under the reader before the server has
	 * agreed to anything. The dialog stays up and busy instead, and the store is
	 * only touched once the server has confirmed - at which point we leave.
	 */
	const handleDeleteProject = useCallback(async () => {
		if (isDeleting) return;
		setIsDeleting(true);

		try {
			const result = await deleteProjectAction(projectId);
			if (!result?.success) throw new Error(result?.error || "Failed");

			deleteProjects(new Set([projectId]));
			setIsDeleteModalOpen(false);
			// The second line matters here more than elsewhere: the reader just
			// typed the project name to prove they meant it, and telling them it is
			// recoverable is the difference between a considered action and a
			// frightening one.
			notify.success("Project deleted", {
				description: `You can restore it from the archive for ${TRASH_RETENTION_DAYS} days.`,
			});

			// The page we are on describes a project that no longer exists, so
			// staying here would show a dead settings screen until something else
			// forced a navigation.
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
