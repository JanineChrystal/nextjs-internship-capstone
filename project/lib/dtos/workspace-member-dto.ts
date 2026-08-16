import type { DbWorkspaceMember } from "@/lib/types/member";
import type { DbUser } from "@/lib/types/user";

export interface WorkspaceMemberOutputDTO {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
	// Job titles held across projects (ProjectMembers.position), not RBAC roles.
	jobRoles: string[];
	projectIds: string[];
	projectCount: number;
	status: "active" | "pending";
}

// Strips characters that would let stored text inject markup when rendered.
function sanitizeText(value: string): string {
	return value.replace(/[<>]/g, "");
}

function toDisplayName(user: DbUser): string {
	const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
	// Falling back to the email local part keeps rows identifiable for users who
	// signed up without a name.
	return sanitizeText(full || user.email.split("@")[0]);
}

export function toWorkspaceMemberDTO(
	membership: DbWorkspaceMember,
	user: DbUser,
	projectIds: string[],
	jobRoles: string[],
): WorkspaceMemberOutputDTO {
	return {
		id: user.id,
		name: toDisplayName(user),
		email: user.email,
		avatarUrl: user.imageUrl ?? undefined,
		jobRoles: jobRoles.map(sanitizeText),
		projectIds,
		projectCount: projectIds.length,
		status: membership.status,
	};
}
