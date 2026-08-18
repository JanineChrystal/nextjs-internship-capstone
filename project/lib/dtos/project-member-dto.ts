import type { RoleAccess } from "@/lib/types/member";

/**
 * The minimal member shape the UI needs to render an avatar and a label -
 * assignee pickers, member chips, the toolbar stack.
 *
 * Deliberately omits the access level. A picker showing who can be assigned has
 * no business knowing who is a co-owner, and a DTO that carries fields its
 * consumer does not need is how permission data leaks into surfaces that were
 * never reviewed for it.
 */
export interface ProjectMemberOutputDTO {
	userId: string;
	name: string;
	email: string;
	avatarUrl: string;
}

/**
 * The fuller shape for the Team & Access table, which is the one surface that
 * genuinely needs role and join information.
 *
 * `status` is the literal "joined" rather than a union: a row here always
 * represents real membership. Someone invited but not yet signed up has no
 * ProjectMembers row at all - they live in PendingInvites and are rendered
 * separately.
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
 * A display name from whatever the user record actually has.
 *
 * Falls back to the email rather than rendering an empty string, because Clerk
 * does not require a name and a blank cell reads as a broken row. This was
 * written out twice - once in the projects DAL and once in the task-assignees
 * DAL - so the two could have drifted on what "no name" should show.
 */
export function toMemberName(user: {
	firstName: string | null;
	lastName: string | null;
	email: string;
}): string {
	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
	return fullName || user.email;
}
