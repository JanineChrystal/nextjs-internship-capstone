import { describe, expect, it } from "vitest";
import { toGroupDTO, toGroupMemberDTO } from "@/lib/dtos/group-dto";

describe("toGroupDTO", () => {
	it("trims name and description", () => {
		const dbTeam = {
			id: "g1",
			name: "  Engineers  ",
			description: "  Backend group  ",
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		const dto = toGroupDTO(
			dbTeam as unknown as Parameters<typeof toGroupDTO>[0],
			5,
		);
		expect(dto.name).toBe("Engineers");
		expect(dto.description).toBe("Backend group");
		expect(dto.memberCount).toBe(5);
	});

	it("formats createdAt as ISO string", () => {
		const dbTeam = {
			id: "g1",
			name: "Eng",
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		const dto = toGroupDTO(
			dbTeam as unknown as Parameters<typeof toGroupDTO>[0],
			0,
		);
		expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
	});

	it("handles null description", () => {
		const dbTeam = {
			id: "g1",
			name: "Eng",
			description: null,
			createdAt: new Date(),
		};
		expect(
			toGroupDTO(dbTeam as unknown as Parameters<typeof toGroupDTO>[0], 0)
				.description,
		).toBeNull();
	});

	it("carries the member ids through", () => {
		/** the settings UI decides from these whether to offer "Add to project" and "Sync members", so a mapper that dropped them would silently show both controls on every group. */
		const dbTeam = { id: "g1", name: "Eng", createdAt: new Date() };
		const dto = toGroupDTO(
			dbTeam as unknown as Parameters<typeof toGroupDTO>[0],
			2,
			["u1", "u2"],
		);

		expect(dto.memberIds).toEqual(["u1", "u2"]);
	});

	it("defaults member ids to an empty array, never undefined", () => {
		/** the default has to be an array - the consumers call .every and .length on it directly, so undefined would throw rather than render an empty group. */
		const dbTeam = { id: "g1", name: "Eng", createdAt: new Date() };
		const dto = toGroupDTO(
			dbTeam as unknown as Parameters<typeof toGroupDTO>[0],
			0,
		);

		expect(dto.memberIds).toEqual([]);
	});
});

describe("toGroupMemberDTO", () => {
	it("builds name from first and last name", () => {
		const dbUser = {
			id: "u1",
			firstName: "Alice",
			lastName: "Smith",
			email: "alice@example.com",
			imageUrl: null,
		};
		const dto = toGroupMemberDTO(
			dbUser as unknown as Parameters<typeof toGroupMemberDTO>[0],
		);
		expect(dto.name).toBe("Alice Smith");
	});

	it("falls back to email local part if names are missing", () => {
		const dbUser = {
			id: "u1",
			firstName: null,
			lastName: null,
			email: "bob.jones@example.com",
			imageUrl: null,
		};
		const dto = toGroupMemberDTO(
			dbUser as unknown as Parameters<typeof toGroupMemberDTO>[0],
		);
		expect(dto.name).toBe("bob.jones");
	});
});
