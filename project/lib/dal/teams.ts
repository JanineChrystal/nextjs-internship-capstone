import "server-only";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { teamMembers, teams, workspaces } from "@/lib/db/schema";
import { type TeamOutputDTO, toTeamDTO } from "@/lib/dtos/team-dto";

export async function createTeamInDB(
	workspaceId: string,
	name: string,
	description: string | null,
	userIds: string[],
): Promise<TeamOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		return await db.transaction(async (tx) => {
			let activeWorkspaceId = workspaceId;
			if (!activeWorkspaceId || activeWorkspaceId === "default") {
				const userWorkspaces = await tx
					.select()
					.from(workspaces)
					.where(eq(workspaces.ownerId, user.id));
				if (userWorkspaces.length > 0) {
					activeWorkspaceId = userWorkspaces[0].id;
				} else {
					throw new Error("No active workspace found for user");
				}
			}

			const [newTeam] = await tx
				.insert(teams)
				.values({
					workspaceId: activeWorkspaceId,
					name,
					description,
				})
				.returning();

			if (userIds.length > 0) {
				await tx.insert(teamMembers).values(
					userIds.map((userId) => ({
						teamId: newTeam.id,
						userId,
					})),
				);
			}

			return toTeamDTO(newTeam);
		});
	} catch (error) {
		throw new Error("Failed to create team in database", { cause: error });
	}
}
