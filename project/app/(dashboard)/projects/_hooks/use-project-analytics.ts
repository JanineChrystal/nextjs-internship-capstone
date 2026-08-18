"use client";

import { useEffect, useState } from "react";
import { getProjectAnalyticsAction } from "@/lib/actions/analytics-actions";
import type { ProjectAnalyticsDTO } from "@/lib/dtos/analytics-dto";
import { reportActionError } from "@/lib/utils/toast";

/**
 * The figures behind a single project's Charts tab.
 *
 * Loads on mount, and the Charts view is code-split behind next/dynamic, so
 * nothing here runs - not the request, not recharts itself - until someone
 * actually opens the tab.
 *
 * The `cancelled` flag is what stops a late response from a project the user has
 * already navigated away from writing itself into state. Without it, switching
 * projects quickly leaves the previous project's numbers under the new
 * project's heading, which looks like a data bug rather than a race.
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
