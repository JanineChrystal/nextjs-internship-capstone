/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { toPendingInviteDTO } from "@/lib/dtos/pending-invite-dto";
import type { DbPendingInvite } from "@/lib/types/pending-invite";

describe("toPendingInviteDTO", () => {
	it("trims email and position and formats dates", () => {
		const dbInvite: Partial<DbPendingInvite> = {
			id: "i1",
			email: " test@example.com ",
			position: " Developer ",
			accessLevel: "member",
			projectId: "p1",
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		const dto = toPendingInviteDTO(
			dbInvite as unknown as DbPendingInvite as unknown as DbPendingInvite,
			" My Project ",
		);
		expect(dto.email).toBe("test@example.com");
		expect(dto.position).toBe("Developer");
		expect(dto.projectName).toBe("My Project");
		expect(dto.invitedAt).toBe("2026-01-01T00:00:00.000Z");
	});

	it("handles null projectName", () => {
		const dbInvite: Partial<DbPendingInvite> = {
			id: "i1",
			email: "test@example.com",
			position: "Developer",
			accessLevel: "member",
			projectId: null,
			createdAt: new Date(),
		};
		const dto = toPendingInviteDTO(
			dbInvite as unknown as DbPendingInvite as unknown as DbPendingInvite,
		);
		expect(dto.projectName).toBeNull();
	});
});
