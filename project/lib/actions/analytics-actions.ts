"use server";

import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { getProjectAnalyticsDAL } from "@/lib/dal/project-analytics";
import type { ProjectAnalyticsDTO } from "@/lib/dtos/analytics-dto";

/**
 * The one analytics read that needs an action layer.
 *
 * The dashboard and /analytics pages are server components and call the DAL
 * directly - going through an action there would add a network round-trip to
 * fetch data the server already had. A project's Charts tab is different: it
 * lives inside a client component that switches views without navigating, so it
 * has no server render to piggyback on.
 *
 * The access decision stays in the DAL, which resolves the caller's project
 * role. This layer only converts a thrown error into the { success, data, error }
 * shape the client hooks expect.
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
