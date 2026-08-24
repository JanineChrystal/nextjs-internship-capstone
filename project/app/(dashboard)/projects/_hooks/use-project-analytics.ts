"use client";

import { useEffect, useState } from "react";
import { getProjectAnalyticsAction } from "@/lib/actions/analytics-actions";
import type { ProjectAnalyticsDTO } from "@/lib/dtos/analytics-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * use-project-analytics hook - lazily fetches project statistics when the Charts
 * tab is opened, employing cancellation flags to prevent race conditions from
 * stale responses when switching projects quickly.
 */
export function useProjectAnalytics(projectId: string) {
	const [analytics, setAnalytics] = useState<ProjectAnalyticsDTO | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!projectId) return;

		let cancelled = false;
		setIsLoading(true);

		getProjectAnalyticsAction(projectId).then((result) => {
			if (cancelled) return;

			if (result.success && result.data) {
				setAnalytics(result.data);
			} else if (result.error) {
				reportActionError("Could not load project analytics", result.error);
			}
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [projectId]);

	return { analytics, isLoading };
}
