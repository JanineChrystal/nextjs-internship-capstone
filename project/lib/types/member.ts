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

// The workspace directory row type now lives with its mapper as
// WorkspaceMemberOutputDTO in lib/dtos/workspace-member-dto.ts. The old
// WorkspaceUser interface was removed: it duplicated that shape and typed
// status as "active" | "inactive", which the WorkspaceStatus enum
// ("pending" | "active") cannot produce.
