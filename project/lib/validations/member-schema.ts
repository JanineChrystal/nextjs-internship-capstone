import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
	projectInvites,
	projectMembers,
	workspaceMembers,
} from "@/lib/db/schema";

// 1. DATABASE SCHEMA VALIDATION (Generated from Drizzle)
export const insertProjectMemberDbSchema = createInsertSchema(projectMembers);
export const selectProjectMemberDbSchema = createSelectSchema(projectMembers);

export const insertWorkspaceMemberDbSchema =
	createInsertSchema(workspaceMembers);
export const selectWorkspaceMemberDbSchema =
	createSelectSchema(workspaceMembers);

export const insertProjectInviteDbSchema = createInsertSchema(projectInvites);
export const selectProjectInviteDbSchema = createSelectSchema(projectInvites);

// 2. UI VALIDATION SCHEMAS
export const RoleAccessEnum = z.enum(["owner", "co-owner", "member", "guest"]);

export const ProjectMemberSchema = z.object({
	userId: z.string(),
	name: z.string().min(1, "Name is required"),
	email: z
		.string()
		.min(1, "Email is required")
		.regex(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Email must end with @gmail.com"),
	avatarUrl: z.string().url("Invalid avatar URL").optional(),
	jobRole: z.string().min(1, "Job role/position is required"),
	roleAccess: RoleAccessEnum,
	status: z.enum(["invited", "joined"]).optional(),
	joinedAt: z.string(),
});

export const AddInviteItemSchema = z.object({
	recipient: z
		.string()
		.min(1, "Recipient is required")
		.refine((val) => !val.includes("@") || val.endsWith("@gmail.com"), {
			message: "Email addresses must end with @gmail.com",
		}),
	jobRole: z.string().min(1, "Job role is required"),
	roleAccess: z.enum(["co-owner", "member", "guest"], {
		message: "Role access selection is required",
	}),
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
