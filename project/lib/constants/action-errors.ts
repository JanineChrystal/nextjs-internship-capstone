/**
 * Messages the group DAL raises deliberately for a user to read.
 *
 * An allow-list rather than a blanket "show the error": a DAL failure can carry
 * a Postgres constraint name or a driver message, and forwarding those to the
 * browser leaks schema details. Anything not listed here is replaced with a
 * generic sentence.
 */
export const GROUP_USER_FACING_ERRORS = [
	"A group with that name already exists",
	"Group not found",
	"Project not found",
	"Only the workspace owner can edit groups",
	"Only the workspace owner can delete groups",
] as const;

/**
 * The same allow-list for workspace directory operations. Kept separate from the
 * group list rather than merged: an allow-list is only meaningful if it is
 * narrow, and one combined list would let a group action surface a workspace
 * message it can never legitimately raise.
 */
export const WORKSPACE_MEMBER_USER_FACING_ERRORS = [
	"Workspace not found",
	"No active workspace found for user",
	"Only the workspace owner can remove members",
	"Only the workspace owner can invite members",
	"The workspace owner cannot be removed",
	"You are already a member of this workspace",
] as const;

export const PENDING_INVITE_MESSAGE =
	"Invite saved. They will get access as soon as they sign up.";
