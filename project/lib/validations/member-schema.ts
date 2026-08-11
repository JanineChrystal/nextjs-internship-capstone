import { z } from "zod";

export const RoleAccessEnum = z.enum(["owner", "co-owner", "member", "guest"]);

export const ProjectMemberSchema = z.object({
	userId: z.string(),
	name: z.string(),
	email: z.string().email(),
	avatarUrl: z.string().url().optional(),
	jobRole: z.string(),
	roleAccess: RoleAccessEnum,
	status: z.enum(["invited", "joined"]).optional(),
	joinedAt: z.string(),
});

export const AddInviteItemSchema = z.object({
	recipient: z.string().min(1, "Email or username is required"),
	jobRole: z.string(),
	roleAccess: z.enum(["co-owner", "member", "guest"]),
});

export const BulkInvitePayloadSchema = z.object({
	projectId: z.string(),
	invites: z.array(AddInviteItemSchema),
});

export const ShareLinkConfigSchema = z.object({
	projectId: z.string(),
	inviteToken: z.string(),
	defaultRole: z.enum(["member", "guest"]),
});

export const FlaggedCommentSchema = z.object({
	commentId: z.string(),
	taskId: z.string(),
	taskTitle: z.string(),
	authorName: z.string(),
	authorAvatar: z.string().url().optional(),
	commentSnippet: z.string(),
	flagReason: z.string(),
	flaggedAt: z.string(),
});
