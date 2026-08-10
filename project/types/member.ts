// System access permissions
export type RoleAccess = "owner" | "co-owner" | "member" | "guest";

// Member record inside project settings
export interface ProjectMember {
	userId: string;
	name: string;
	email: string;
	avatarUrl?: string;
	// Custom workplace title (e.g., "Frontend Developer")
	jobRole: string;
	// System authorization role
	roleAccess: RoleAccess;
	joinedAt: string;
}

// Single item in the modal direct invite queue
export interface PendingInviteItem {
	recipient: string; // email or username
	jobRole: string;
	roleAccess: Exclude<RoleAccess, "guest" | "owner">;
}

// Payload for bulk invite server action
export interface BulkInvitePayload {
	projectId: string;
	invites: PendingInviteItem[];
}

// Shareable link configuration
export interface ShareLinkConfig {
	projectId: string;
	inviteToken: string;
	defaultRole: "member" | "guest";
}

// Flagged comment item for moderation table
export interface FlaggedCommentItem {
	commentId: string;
	taskId: string;
	taskTitle: string;
	authorName: string;
	authorAvatar?: string;
	commentSnippet: string;
	flagReason: string;
	flaggedAt: string;
}
