import type { z } from "zod";
import type { projectMembers, workspaceMembers } from "@/lib/db/schema";
import type {
	AddInviteItemSchema,
	BulkInvitePayloadSchema,
	FlaggedCommentSchema,
	ProjectMemberSchema,
	RoleAccessEnum,
	ShareLinkConfigSchema,
} from "@/lib/validations/member-schema";

export type DbProjectMember = typeof projectMembers.$inferSelect;
export type NewDbProjectMember = typeof projectMembers.$inferInsert;
export type DbWorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewDbWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type RoleAccess = z.infer<typeof RoleAccessEnum>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type PendingInviteItem = z.infer<typeof AddInviteItemSchema>;
export type BulkInvitePayload = z.infer<typeof BulkInvitePayloadSchema>;
export type ShareLinkConfig = z.infer<typeof ShareLinkConfigSchema>;
export type FlaggedCommentItem = z.infer<typeof FlaggedCommentSchema>;

export interface WorkspaceUser {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
	roles: string[];
	projectIds: string[];
	projectCount: number;
	status: "active" | "inactive";
}
