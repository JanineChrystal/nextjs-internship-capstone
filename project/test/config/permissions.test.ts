import { describe, expect, it } from "vitest";
import {
	assertRolePermissionsAreNested,
	hasPermission,
	resolveEffectiveRole,
} from "@/lib/config/permissions";

describe("hasPermission", () => {
	it("owner has all permissions", () => {
		expect(hasPermission("owner", "delete_workspace")).toBe(true);
		expect(hasPermission("owner", "manage_billing")).toBe(true);
	});

	it("guest has limited permissions", () => {
		expect(hasPermission("guest", "view_project")).toBe(true);
		expect(hasPermission("guest", "comment_task")).toBe(true);
		expect(hasPermission("guest", "edit_task")).toBe(false);
		expect(hasPermission("guest", "delete_project")).toBe(false);
	});
});

describe("resolveEffectiveRole", () => {
	it("returns the highest-ranked role", () => {
		expect(resolveEffectiveRole(["guest", "owner", "member"])).toBe("owner");
		expect(resolveEffectiveRole(["guest", "member"])).toBe("member");
		expect(resolveEffectiveRole(["guest"])).toBe("guest");
	});

	it("returns null for an empty array", () => {
		expect(resolveEffectiveRole([])).toBeNull();
	});
});

describe("assertRolePermissionsAreNested", () => {
	it("confirms the production data is valid", () => {
		// This should return null because our ROLE_PERMISSIONS constant is correctly nested
		expect(assertRolePermissionsAreNested()).toBeNull();
	});
});
