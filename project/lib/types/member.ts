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
 * The single definition of a project role.
 *
 * Derived from the Zod enum rather than hand-written, so the runtime validator
 * and the compile-time type can never disagree. `lib/config/permissions.ts` used
 * to declare its own identical union and `lib/dal/projects.ts` inlined a third
 * copy - adding a role would have updated one and silently left the others
 * behind.
 */
export type RoleAccess = z.infer<typeof RoleAccessEnum>;

/**
 * Every action the permission table can grant. Lives here rather than beside
 * ROLE_PERMISSIONS because it is a domain vocabulary, and config files should
 * hold configuration values, not type declarations.
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
