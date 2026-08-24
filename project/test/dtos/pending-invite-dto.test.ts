/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { toPendingInviteDTO } from "@/lib/dtos/pending-invite-dto";

describe("toPendingInviteDTO", () => {
	it("trims email and position and formats dates", () => {
		const dbInvite: any = {
			id: "i1",
			email: " test@example.com ",
			position: " Developer ",
			accessLevel: "member",
			projectId: "p1",
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		const dto = toPendingInviteDTO(dbInvite, " My Project ");
		expect(dto.email).toBe("test@example.com");
		expect(dto.position).toBe("Developer");
		expect(dto.projectName).toBe("My Project");
		expect(dto.invitedAt).toBe("2026-01-01T00:00:00.000Z");
	});

	it("handles null projectName", () => {
		const dbInvite: any = {
			id: "i1",
			email: "test@example.com",
			position: "Developer",
			accessLevel: "member",
			projectId: null,
			createdAt: new Date(),
		};
		const dto = toPendingInviteDTO(dbInvite);
		expect(dto.projectName).toBeNull();
	});
});

