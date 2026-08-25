import type { RoleAccess } from "@/lib/types/member";

/**
 * project member output dto - defines the minimal member shape needed for
 * avatar and label rendering, deliberately excluding access levels to prevent
 * unauthorized permission leakage into generic UI pickers.
 */
export interface ProjectMemberOutputDTO {
	userId: string;
	name: string;
	email: string;
	avatarUrl: string;
}

/**
 * project member detailed output dto - defines the comprehensive member shape
 * needed for the Team & Access table, using a literal 'joined' status since
 * pending invites are handled by a separate table.
 */
export interface ProjectMemberDetailedOutputDTO {
	userId: string;
	name: string;
	email: string;
	avatarUrl: string;
	jobRole: string;
	roleAccess: RoleAccess;
	status: "joined";
	joinedAt: string;
}

/**
 * to member name - resolves a display name from the user record, providing
 * a robust fallback to the email address to prevent rendering broken rows
 * when Clerk profiles lack explicit names.
 */
export function toMemberName(user: {
	firstName: string | null;
	lastName: string | null;
	email: string;
}): string {
	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
	return fullName || user.email;
}
