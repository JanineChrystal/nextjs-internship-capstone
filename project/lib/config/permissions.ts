import type { Permission, RoleAccess } from "@/lib/types/member";

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

/**
 * role rank precedence - defines a numeric rank where higher values
 * override lower ones when users have multiple overlapping project
 * roles.
 */
export const ROLE_RANK: Record<RoleAccess, number> = {
	owner: 4,
	"co-owner": 3,
	member: 2,
	guest: 1,
};

/**
 * resolve effective role - collapses multiple user roles into the
 * single highest governing role, relying on a strict inclusion chain
 * where higher roles encompass all lower role permissions.
 */
export function resolveEffectiveRole(roles: RoleAccess[]): RoleAccess | null {
	if (roles.length === 0) return null;

	return roles.reduce((highest, role) =>
		ROLE_RANK[role] > ROLE_RANK[highest] ? role : highest,
	);
}

/**
 * assert role inclusion chain - validates that higher roles properly
 * inherit all permissions of lower roles, returning any discrepancies
 * instead of throwing to allow flexible error handling in tests.
 */
export function assertRolePermissionsAreNested(): {
	lower: RoleAccess;
	higher: RoleAccess;
	missing: Permission[];
} | null {
	const ascending = (Object.keys(ROLE_RANK) as RoleAccess[]).sort(
		(a, b) => ROLE_RANK[a] - ROLE_RANK[b],
	);

	for (let i = 0; i < ascending.length - 1; i++) {
		const lower = ascending[i];
		const higher = ascending[i + 1];
		const missing = ROLE_PERMISSIONS[lower].filter(
			(permission) => !ROLE_PERMISSIONS[higher].includes(permission),
		);
		if (missing.length > 0) return { lower, higher, missing };
	}

	return null;
}
