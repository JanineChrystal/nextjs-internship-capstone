"use client";

import { useEffect, useState } from "react";
import { getTaskActivityAction } from "@/lib/actions/activity-actions";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * use-task-activity hook - lazily loads task history only when the activity tab
 * is viewed, keying state by task ID to prevent displaying stale history when
 * the modal is reused for different tasks.
 */
export function useTaskActivity(
	taskId: string | undefined,
	projectId: string | undefined,
	isActive: boolean,
) {
	const [items, setItems] = useState<ActivityFeedItemDTO[]>([]);
	const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// cross-task pollution prevention - immediately hides existing rows when the selected task ID changes to avoid showing history for the wrong task while loading.
	const isStale = loadedTaskId !== taskId;

	useEffect(() => {
		if (!isActive || !taskId || !projectId) return;
		if (loadedTaskId === taskId) return;

		let cancelled = false;
		setIsLoading(true);

		getTaskActivityAction(taskId, projectId).then((result) => {
			if (cancelled) return;

			if (result.success && result.data) {
				setItems(result.data);
				setLoadedTaskId(taskId);
			} else if (result.error) {
				reportActionError("Could not load task activity", result.error);
			}
			setIsLoading(false);
		});

		// stale response safeguard - aborts state updates if the user navigated to another task before the fetch completed.
		return () => {
			cancelled = true;
		};
	}, [isActive, taskId, projectId, loadedTaskId]);

	return { items: isStale ? [] : items, isLoading };
}
