import type { z } from "zod";
import type { projectMembers, workspaceMembers } from "@/lib/db/schema";
import type {
	AddInviteItemSchema,
	BulkInvitePayloadSchema,
	FlaggedCommentSchema,
	ProjectMemberSchema,
	RoleAccessEnum,
} from "@/lib/validations/member-schema";

export type DbProjectMember = typeof projectMembers.$inferSelect;
export type NewDbProjectMember = typeof projectMembers.$inferInsert;
export type DbWorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewDbWorkspaceMember = typeof workspaceMembers.$inferInsert;

/**
 * role access - authoritative definition of a project role derived directly
 * from the Zod schema, ensuring runtime validation and compile-time types
 * remain perfectly synchronized.
 */
export type RoleAccess = z.infer<typeof RoleAccessEnum>;

/**
 * permission - exhaustively lists every action the permissions table can
 * grant, representing the core domain vocabulary for access control.
 */
export type Permission =
	| "manage_workspace"
	| "delete_workspace"
	| "manage_billing"
	| "create_project"
	| "edit_project"
	| "delete_project"
	| "manage_members"
	| "create_task"
	| "edit_task"
	| "delete_task"
	| "manage_boards"
	| "view_project"
	| "comment_task";

export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type PendingInviteItem = z.infer<typeof AddInviteItemSchema>;
export type BulkInvitePayload = z.infer<typeof BulkInvitePayloadSchema>;
export type FlaggedCommentItem = z.infer<typeof FlaggedCommentSchema>;

// The workspace directory row type now lives with its mapper as
// WorkspaceMemberOutputDTO in lib/dtos/workspace-member-dto.ts. The old
// WorkspaceUser interface was removed: it duplicated that shape and typed
// status as "active" | "inactive", which the WorkspaceStatus enum
// ("pending" | "active") cannot produce.
