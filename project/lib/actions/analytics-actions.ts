"use server";

import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { getProjectAnalyticsDAL } from "@/lib/dal/project-analytics";
import type { ProjectAnalyticsDTO } from "@/lib/dtos/analytics-dto";

/**
 * analytics actions - provides a server action for client
 * components (like the project charts tab) to fetch analytics data,
 * avoiding unnecessary round-trips for server components.
 */
export async function getProjectAnalyticsAction(projectId: string): Promise<{
	success: boolean;
	data?: ProjectAnalyticsDTO;
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const analytics = await getProjectAnalyticsDAL(projectId);
		return { success: true, data: analytics };
	} catch (error) {
		console.error("getProjectAnalyticsAction error:", error);
		return { success: false, error: "Could not load project analytics" };
	}
}
