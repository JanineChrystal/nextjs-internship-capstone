export type RoleAccess = "owner" | "co-owner" | "member" | "guest";

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

export const ROLE_PERMISSIONS: Record<RoleAccess, Permission[]> = {
	owner: [
		"manage_workspace",
		"delete_workspace",
		"manage_billing",
		"create_project",
		"edit_project",
		"delete_project",
		"manage_members",
		"create_task",
		"edit_task",
		"delete_task",
		"manage_boards",
		"view_project",
		"comment_task",
	],
	"co-owner": [
		"create_project",
		"edit_project",
		"manage_members",
		"create_task",
		"edit_task",
		"delete_task",
		"manage_boards",
		"view_project",
		"comment_task",
	],
	member: ["create_task", "edit_task", "view_project", "comment_task"],
	guest: ["view_project", "comment_task"],
};

export function hasPermission(
	role: RoleAccess,
	permission: Permission,
): boolean {
	return ROLE_PERMISSIONS[role].includes(permission);
}
