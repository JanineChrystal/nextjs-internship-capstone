/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { toUserDTO } from "@/lib/dtos/user-dto";

describe("toUserDTO", () => {
	it("maps all fields 1:1", () => {
		const dbUser: any = {
			id: "u1",
			email: "test@example.com",
			firstName: "Alice",
			lastName: "Smith",
			imageUrl: "http://example.com/avatar.png",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(toUserDTO(dbUser)).toEqual(dbUser);
	});
});

