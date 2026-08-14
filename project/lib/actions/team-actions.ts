"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { createTeamInDB } from "@/lib/dal/teams";
import type { TeamOutputDTO } from "@/lib/dtos/team-dto";

export async function createTeamAction(
	workspaceId: string,
	formData: FormData,
	userIds: string[],
): Promise<{ success: boolean; data?: TeamOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		const name = formData.get("name")?.toString();
		const description = formData.get("description")?.toString() || null;

		if (!name) {
			return { success: false, error: "Team name is required" };
		}

		const newTeam = await createTeamInDB(
			workspaceId,
			name,
			description,
			userIds,
		);

		revalidatePath("/team");

		return { success: true, data: newTeam };
	} catch (error) {
		console.error("createTeamAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
