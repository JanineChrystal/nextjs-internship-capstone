import { describe, expect, it } from "vitest";
import {
	AddProjectInviteSchema,
	AddWorkspaceInviteSchema,
	RoleAccessEnum,
} from "@/lib/validations/member-schema";

describe("RoleAccessEnum", () => {
	it("accepts valid roles", () => {
		expect(RoleAccessEnum.safeParse("owner").success).toBe(true);
		expect(RoleAccessEnum.safeParse("co-owner").success).toBe(true);
		expect(RoleAccessEnum.safeParse("member").success).toBe(true);
		expect(RoleAccessEnum.safeParse("guest").success).toBe(true);
	});

	it("rejects unknown roles", () => {
		expect(RoleAccessEnum.safeParse("admin").success).toBe(false);
	});
});

describe("AddProjectInviteSchema", () => {
	it("requires jobRole", () => {
		const result = AddProjectInviteSchema.safeParse({
			recipient: "test@gmail.com",
			roleAccess: "member",
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-gmail emails", () => {
		const result = AddProjectInviteSchema.safeParse({
			recipient: "test@example.com",
			jobRole: "Dev",
			roleAccess: "member",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid payload", () => {
		const result = AddProjectInviteSchema.safeParse({
			recipient: "test@gmail.com",
			jobRole: "Dev",
			roleAccess: "member",
		});
		expect(result.success).toBe(true);
	});
});

describe("AddWorkspaceInviteSchema", () => {
	it("does not require jobRole or roleAccess", () => {
		const result = AddWorkspaceInviteSchema.safeParse({
			recipient: "test@gmail.com",
		});
		expect(result.success).toBe(true);
	});
});
