"use client";

import { useCallback, useState } from "react";
import { getProjectBoardsAction } from "@/lib/actions/board-actions";
import type { QuickActionId } from "@/lib/types/dashboard";
import { reportActionError } from "@/lib/utils/toast";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";

/**
 * use-quick-actions hook - manages modal state for shortcuts by keeping
 * a single active action identifier to prevent conflicting or overlapping
 * modals from opening simultaneously.
 */
export function useQuickActions() {
	// Local state
	const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);
	const [pickedProjectId, setPickedProjectId] = useState<string | null>(null);
	const [isPreparing, setIsPreparing] = useState(false);

	const openTaskModal = useTaskStore((state) => state.openTaskModal);
	const setColumns = useBoardStore((state) => state.setColumns);

	const reset = useCallback(() => {
		setActiveAction(null);
		setPickedProjectId(null);
		setIsPreparing(false);
	}, []);

	/**
	 * start task for project - fetches project columns ahead of opening the
	 * task modal to prevent optimistic row creation errors if no valid columns
	 * exist.
	 */
	const startTaskForProject = useCallback(
		async (projectId: string) => {
			setIsPreparing(true);
			try {
				const result = await getProjectBoardsAction(projectId);

				if (!result.success || !result.data) {
					reportActionError("Could not open the task editor", result.error);
					reset();
					return;
				}

				if (result.data.length === 0) {
					reportActionError(
						"Could not open the task editor",
						"That project has no board columns yet. Open the project and add one first.",
					);
					reset();
					return;
				}

				setColumns(
					result.data.map((board) => ({
						id: board.id,
						title: board.name,
						dotColor: board.isCompletionBoard ? "bg-success" : "bg-primary",
						order: board.position,
						isCompletionBoard: board.isCompletionBoard,
					})),
				);

				// inject project id - passes the project ID directly since the dashboard route lacks the project URL context the modal normally reads.
				openTaskModal(undefined, { projectId });
				reset();
			} catch (error) {
				reportActionError("Could not open the task editor", error);
				reset();
			}
		},
		[openTaskModal, setColumns, reset],
	);

	// Handlers
	const start = useCallback((id: QuickActionId) => {
		setPickedProjectId(null);
		setActiveAction(id);
	}, []);

	const selectProject = useCallback(
		(projectId: string) => {
			if (activeAction === "create-task") {
				void startTaskForProject(projectId);
				return;
			}
			// immediate select - allows adding members without pre-fetching since the invite modal manages its own data loading.
			setPickedProjectId(projectId);
		},
		[activeAction, startTaskForProject],
	);

	const isPickingProject =
		(activeAction === "create-task" || activeAction === "add-project-member") &&
		pickedProjectId === null;

	return {
		activeAction,
		pickedProjectId,
		isPickingProject,
		isPreparing,
		start,
		selectProject,
		reset,
	};
}
