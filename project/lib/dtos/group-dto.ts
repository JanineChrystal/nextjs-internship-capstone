import type { DbTeam } from "@/lib/types/team";
import type { DbUser } from "@/lib/types/user";

export interface GroupOutputDTO {
	id: string;
	name: string;
	description: string | null;
	memberCount: number;
	/** roster ids - carried on the list row so the UI can tell, without expanding the group, whether its people are already on the project. */
	memberIds: string[];
	createdAt: string;
}

export interface GroupMemberDTO {
	id: string;
	name: string;
	email: string;
	imageUrl: string | null;
}

export function toGroupDTO(
	team: DbTeam,
	memberCount: number,
	memberIds: string[] = [],
): GroupOutputDTO {
	return {
		id: team.id,
		name: team.name.trim(),
		description: team.description?.trim() || null,
		memberCount,
		memberIds,
		createdAt: team.createdAt.toISOString(),
	};
}

/**
 * to group member dto - omits clerkId deliberately because group rosters
 * are visible to co-owners, making identity provider IDs unnecessary for the UI.
 */
export function toGroupMemberDTO(user: DbUser): GroupMemberDTO {
	const fullName = [user.firstName, user.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();

	return {
		id: user.id,
		name: fullName || user.email.split("@")[0],
		email: user.email.trim(),
		imageUrl: user.imageUrl,
	};
}
