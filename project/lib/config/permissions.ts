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

// Higher number wins when a user qualifies for a project through several paths
// at once (owner, a direct membership, and/or one or more teams).
export const ROLE_RANK: Record<RoleAccess, number> = {
	owner: 4,
	"co-owner": 3,
	member: 2,
	guest: 1,
};

/**
 * Collapses every role a user holds on a project down to the one that governs.
 *
 * Taking the highest rank is equivalent to taking the union of all granted
 * permissions ONLY because ROLE_PERMISSIONS is a total inclusion chain:
 * guest subset of member subset of co-owner subset of owner. If that chain is
 * ever broken - by giving a lower role a permission a higher one lacks - this
 * would start silently under-granting. `assertRolePermissionsAreNested` guards
 * that assumption.
 */
export function resolveEffectiveRole(roles: RoleAccess[]): RoleAccess | null {
	if (roles.length === 0) return null;

	return roles.reduce((highest, role) =>
		ROLE_RANK[role] > ROLE_RANK[highest] ? role : highest,
	);
}

/**
 * Verifies the inclusion chain that `resolveEffectiveRole` depends on.
 * Returns the offending pair rather than throwing, so callers choose how loud
 * to be. Intended for tests and dev-time assertions.
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
