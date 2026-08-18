"use client";

import { useEffect, useState } from "react";
import { getProjectActivityAction } from "@/lib/actions/activity-actions";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * The whole project's history, for the Project Activity section in settings.
 *
 * Unlike the task tab this loads on mount: settings is a page someone navigated
 * to deliberately, so the section is expected to have content when they arrive
 * rather than after another interaction.
 */
export function useProjectActivity(projectId: string) {
	const [items, setItems] = useState<ActivityFeedItemDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!projectId) return;

		let cancelled = false;
		setIsLoading(true);

		getProjectActivityAction(projectId).then((result) => {
			if (cancelled) return;

			if (result.success && result.data) {
				setItems(result.data);
			} else if (result.error) {
				reportActionError("Could not load project activity", result.error);
			}
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [projectId]);

	return { items, isLoading };
}
