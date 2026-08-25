import { describe, expect, it } from "vitest";
import { toUserDTO } from "@/lib/dtos/user-dto";
import type { DbUser } from "@/lib/types/user";

describe("toUserDTO", () => {
	it("maps all fields 1:1", () => {
		const dbUser: Partial<DbUser> = {
			id: "u1",
			email: "test@example.com",
			firstName: "Alice",
			lastName: "Smith",
			imageUrl: "http://example.com/avatar.png",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(toUserDTO(dbUser as unknown as DbUser)).toEqual(dbUser);
	});
});
