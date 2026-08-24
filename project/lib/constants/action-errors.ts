/**
 * group user-facing errors - provides an allow-list of safe error
 * messages that the DAL can surface for group actions, preventing
 * database schema details from leaking to the client.
 */
/** duplicate roster message - shared by the DAL that throws it and the allow-list that lets it through, so the two cannot drift apart into a generic error. */
export const DUPLICATE_GROUP_ROSTER_ERROR =
	"These exact members are already saved as a group. Use Sync members on that group to update it instead.";

export const GROUP_USER_FACING_ERRORS = [
	DUPLICATE_GROUP_ROSTER_ERROR,
	"A group with that name already exists",
	"Group not found",
	"Project not found",
	"Only the workspace owner can edit groups",
	"Only the workspace owner can delete groups",
] as const;

/**
 * workspace user-facing errors - provides a distinct, isolated
 * allow-list for workspace directory operations to ensure actions
 * only surface strictly relevant messages.
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
