"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { createTeamInDB } from "@/lib/dal/teams";
import type { TeamOutputDTO } from "@/lib/dtos/team-dto";
import { CreateTeamSchema } from "@/lib/validations/team-schema";

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

		const validationResult = CreateTeamSchema.safeParse({
			name: formData.get("name")?.toString(),
			description: formData.get("description")?.toString() || undefined,
			userIds,
		});

		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error.issues[0]?.message ?? "Invalid team data",
			};
		}

		const newTeam = await createTeamInDB(workspaceId, validationResult.data);

		revalidatePath("/team");

		return { success: true, data: newTeam };
	} catch (error) {
		// Validation failures raised by the DAL carry messages meant for the user;
		// everything else is reported generically.
		const message =
			error instanceof Error &&
			[
				"Workspace not found",
				"One or more users are not members of this workspace",
				"A team with that name already exists",
			].includes(error.message)
				? error.message
				: "An unexpected error occurred";

		console.error("createTeamAction error:", error);
		return { success: false, error: message };
	}
}
