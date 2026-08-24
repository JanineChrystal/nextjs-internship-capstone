"use server";

import {
	getProjectActivityLogsDAL,
	getTaskActivityLogsDAL,
} from "@/lib/dal/activity";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { ActivityFeedItemDTO } from "@/lib/dtos/activity-dto";

/**
 * activity actions - fetches history feeds for tasks and projects,
 * delegating access checks to the DAL and formatting responses for
 * client hooks.
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
