"use client";

import { useCallback, useState } from "react";
import { getProjectBoardsAction } from "@/lib/actions/board-actions";
import type { QuickActionId } from "@/lib/types/dashboard";
import { reportActionError } from "@/lib/utils/toast";
import { useBoardStore } from "@/stores/use-board-store";
import { useTaskStore } from "@/stores/use-task-store";

/**
 * Which shortcut is running, and what it still needs.
 *
 * Two of the four actions are a single step - open a modal. The other two are
 * two steps: ask which project, then open the modal for it. Rather than four
 * booleans that can contradict each other, one nullable id says which action is
 * mid-flight and one nullable project id says whether it has an answer yet.
 *
 * That also makes the illegal states unrepresentable: there is no way to have
 * the task modal and the invite modal open at once, because `activeAction` holds
 * exactly one value.
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
	 * Loads the chosen project's columns before the task modal opens.
	 *
	 * The board store is normally filled by the project page on the server. From
	 * here there is no such page, and the modal cannot save a task without
	 * knowing which column to put it in - it would create the row optimistically,
	 * fail to resolve a board, and roll back with an error. So the columns are
	 * fetched first and the modal only opens once they are in place.
	 *
	 * Failing here stops the flow rather than opening a modal that cannot save.
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

				// The project travels with the open call, because the task modal reads
				// its project from the route and there is no project in this one.
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
			// Adding a member needs nothing loaded first - the invite modal fetches
			// that project's pending invites itself.
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
