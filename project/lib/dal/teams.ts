import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { resolveActiveWorkspaceDAL } from "@/lib/dal/workspaces";
import { db } from "@/lib/db";
import { teamMembers, teams, workspaceMembers } from "@/lib/db/schema";
import { type TeamOutputDTO, toTeamDTO } from "@/lib/dtos/team-dto";
import type { CreateTeamInput } from "@/lib/types/team";

/**
 * assert users are workspace members - strictly validates that all users
 * belong to the workspace before addition to a team, preventing cross-tenant
 * privilege escalation.
 */
async function assertUsersAreWorkspaceMembers(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	workspaceId: string,
	userIds: string[],
): Promise<void> {
	if (userIds.length === 0) return;

	const rows = await tx
		.select({ userId: workspaceMembers.userId })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, workspaceId),
				inArray(workspaceMembers.userId, userIds),
				isNull(workspaceMembers.deletedAt),
			),
		);

	if (rows.length !== userIds.length) {
		throw new Error("One or more users are not members of this workspace");
	}
}

export async function createTeamInDB(
	workspaceId: string,
	data: CreateTeamInput,
): Promise<TeamOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	/** verify workspace access - ensures the caller genuinely belongs to the workspace before allowing team creation. */
	const workspace = await resolveActiveWorkspaceDAL(workspaceId);

	try {
		return await db.transaction(async (tx) => {
			await assertUsersAreWorkspaceMembers(tx, workspace.id, data.userIds);

			const [newTeam] = await tx
				.insert(teams)
				.values({
					workspaceId: workspace.id,
					name: data.name,
					description: data.description ?? null,
				})
				.returning();

			if (data.userIds.length > 0) {
				await tx.insert(teamMembers).values(
					data.userIds.map((userId) => ({
						teamId: newTeam.id,
						userId,
					})),
				);
			}

			return toTeamDTO(newTeam);
		});
	} catch (error) {
		/** surface safe errors - bubbles up specific validation messages verbatim while wrapping database internals. */
		if (
			error instanceof Error &&
			(error.message ===
				"One or more users are not members of this workspace" ||
				error.message === "Workspace not found")
		) {
			throw error;
		}

		if (
			error instanceof Error &&
			error.message.includes("Teams_workspaceId_name_live_unique")
		) {
			throw new Error("A team with that name already exists");
		}

		throw new Error("Failed to create team in database", { cause: error });
	}
}
