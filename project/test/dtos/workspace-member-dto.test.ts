/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { toWorkspaceMemberDTO } from "@/lib/dtos/workspace-member-dto";
import type { DbWorkspaceMember } from "@/lib/types/member";
import type { DbUser } from "@/lib/types/user";

describe("toWorkspaceMemberDTO", () => {
	it("sanitises display name and job roles", () => {
		const membership: Partial<DbWorkspaceMember> = { status: "active" };
		const user: Partial<DbUser> = {
			id: "u1",
			firstName: "<b>Bob</b>",
			lastName: "Smith",
			email: "bob@example.com",
		};
		const dto = toWorkspaceMemberDTO(
			membership as unknown as DbWorkspaceMember,
			user as unknown as DbUser,
			["p1"],
			["<script>Dev</script>"],
		);
		expect(dto.name).toBe("bBob/b Smith");
		expect(dto.jobRoles).toEqual(["scriptDev/script"]);
	});

	it("builds name with fallback to email local part", () => {
		const membership: Partial<DbWorkspaceMember> = { status: "active" };
		const user: Partial<DbUser> = {
			id: "u1",
			firstName: null,
			lastName: null,
			email: "bob.smith@example.com",
		};
		const dto = toWorkspaceMemberDTO(
			membership as unknown as DbWorkspaceMember,
			user as unknown as DbUser,
			[],
			[],
		);
		expect(dto.name).toBe("bob.smith");
	});

	it("counts projects correctly", () => {
		const membership: Partial<DbWorkspaceMember> = { status: "active" };
		const user: Partial<DbUser> = { id: "u1", email: "a@b.com" };
		const dto = toWorkspaceMemberDTO(
			membership as unknown as DbWorkspaceMember,
			user as unknown as DbUser,
			["p1", "p2", "p3"],
			[],
		);
		expect(dto.projectCount).toBe(3);
	});
});
