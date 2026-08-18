"use client";

import { useEffect, useState } from "react";
import { getTaskActivityAction } from "@/lib/actions/activity-actions";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * The history of one task, loaded when the Activity tab is actually opened.
 *
 * `isActive` gates the fetch rather than unmounting the tab when hidden: staying
 * mounted preserves scroll position when switching back and forth, but there is
 * no reason to query a tab nobody has looked at. Most people open a task to read
 * comments and never touch this tab, so loading eagerly would be a wasted round
 * trip on every task open.
 *
 * Loaded state is keyed to the task id rather than a plain boolean. The modal is
 * reused across tasks - it does not unmount between them - so a boolean flag
 * would leave the previous task's history on screen under the new task's name.
 */
export function useTaskActivity(
	taskId: string | undefined,
	projectId: string | undefined,
	isActive: boolean,
) {
	const [items, setItems] = useState<ActivityFeedItemDTO[]>([]);
	const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Never show one task's rows while another task's id is open, even for the
	// render between switching tasks and the new fetch resolving.
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

		// Guards against a slow response landing after the modal has moved on to
		// a different task.
		return () => {
			cancelled = true;
		};
	}, [isActive, taskId, projectId, loadedTaskId]);

	return { items: isStale ? [] : items, isLoading };
}
