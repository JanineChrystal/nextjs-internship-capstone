"use server";

import {
	getProjectActivityLogsDAL,
	getTaskActivityLogsDAL,
} from "@/lib/dal/activity";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";

/**
 * History feeds for the two surfaces that show them.
 *
 * Both are read-only, and both delegate the access decision to the DAL, which
 * resolves project role. This layer only translates a thrown error into the
 * { success, data, error } shape the client hooks already expect.
 */

export async function getTaskActivityAction(
	taskId: string,
	projectId: string,
): Promise<{
	success: boolean;
	data?: ActivityFeedItemDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const activity = await getTaskActivityLogsDAL(taskId, projectId);
		return { success: true, data: activity };
	} catch (error) {
		console.error("getTaskActivityAction error:", error);
		return { success: false, error: "Could not load task activity" };
	}
}

export async function getProjectActivityAction(projectId: string): Promise<{
	success: boolean;
	data?: ActivityFeedItemDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const activity = await getProjectActivityLogsDAL(projectId);
		return { success: true, data: activity };
	} catch (error) {
		console.error("getProjectActivityAction error:", error);
		return { success: false, error: "Could not load project activity" };
	}
}
