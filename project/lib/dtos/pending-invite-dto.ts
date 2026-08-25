import type { RoleAccess } from "@/lib/types/member";
import type { DbPendingInvite } from "@/lib/types/pending-invite";

export interface PendingInviteOutputDTO {
	id: string;
	email: string;
	position: string;
	accessLevel: RoleAccess;
	projectId: string | null;
	projectName: string | null;
	invitedAt: string;
}

/**
 * to pending invite dto - strips a stored invite down to its essential UI
 * fields, intentionally omitting internal IDs from a roster visible to co-owners.
 */
export function toPendingInviteDTO(
	invite: DbPendingInvite,
	projectName: string | null = null,
): PendingInviteOutputDTO {
	return {
		id: invite.id,
		email: sanitize(invite.email),
		position: sanitize(invite.position),
		accessLevel: invite.accessLevel as RoleAccess,
		projectId: invite.projectId,
		projectName: projectName ? sanitize(projectName) : null,
		invitedAt: invite.createdAt.toISOString(),
	};
}

function sanitize(value: string): string {
	return value.trim();
}
