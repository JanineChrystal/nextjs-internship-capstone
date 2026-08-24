"use client";

import { useEffect, useState } from "react";
import { getProjectActivityAction } from "@/lib/actions/activity-actions";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * use-project-activity hook - fetches the entire project history immediately on
 * mount to populate the project activity settings section upon navigation.
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
