import type { RoleAccess } from "@/lib/types/member";
import type { DbPendingInvite } from "@/lib/types/pending-invite";
import { deterministicDecrypt } from "@/lib/utils/encryption";

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
 * Strips a stored invite down to what the UI needs.
 *
 * `invitedBy` and `workspaceId` are deliberately omitted: neither is rendered,
 * and leaking internal ids from a list that is visible to co-owners buys
 * nothing.
 */
export function toPendingInviteDTO(
	invite: DbPendingInvite,
	projectName: string | null = null,
): PendingInviteOutputDTO {
	return {
		id: invite.id,
		email: deterministicDecrypt(invite.email) || sanitize(invite.email),
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
