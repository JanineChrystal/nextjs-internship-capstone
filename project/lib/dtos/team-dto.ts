import type { InferSelectModel } from "drizzle-orm";
import type { teams } from "@/lib/db/schema";

export type DbTeam = InferSelectModel<typeof teams>;

export interface TeamOutputDTO {
	id: string;
	workspaceId: string;
	name: string;
	description: string | null;
	createdAt: string;
}

export function toTeamDTO(team: DbTeam): TeamOutputDTO {
	return {
		id: team.id,
		workspaceId: team.workspaceId,
		name: team.name,
		description: team.description,
		createdAt: team.createdAt.toISOString(),
	};
}
