/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { toTeamDTO } from "@/lib/dtos/team-dto";
import type { DbTeam } from "@/lib/types/team";

describe("toTeamDTO", () => {
	it("sanitises <> in name and description", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const dbTeam: Partial<DbTeam> = {
			id: "t1",
			workspaceId: "w1",
			name: "<script>Team</script>",
			description: "<b>Desc</b>",
			createdAt: date,
			updatedAt: date,
		};
		const dto = toTeamDTO(dbTeam as unknown as DbTeam);
		expect(dto.name).toBe("scriptTeam/script");
		expect(dto.description).toBe("bDesc/b");
	});

	it("formats dates as ISO strings", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const dbTeam: Partial<DbTeam> = {
			id: "t1",
			workspaceId: "w1",
			name: "Team",
			description: null,
			createdAt: date,
			updatedAt: date,
		};
		const dto = toTeamDTO(dbTeam as unknown as DbTeam);
		expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
		expect(dto.updatedAt).toBe("2026-01-01T00:00:00.000Z");
	});
});
