import type { DbTeam } from "@/lib/types/team";

export interface TeamOutputDTO {
	id: string;
	workspaceId: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

// Strips characters that would let stored text inject markup when rendered.
function sanitizeText<T extends string | null>(value: T): T {
	if (value === null) return value;
	return value.replace(/[<>]/g, "") as T;
}

export function toTeamDTO(team: DbTeam): TeamOutputDTO {
	return {
		id: team.id,
		workspaceId: team.workspaceId,
		name: sanitizeText(team.name),
		description: sanitizeText(team.description),
		createdAt: team.createdAt.toISOString(),
		updatedAt: team.updatedAt.toISOString(),
	};
}
