import { describe, expect, it } from "vitest";
import { toMemberName } from "@/lib/dtos/project-member-dto";

describe("toMemberName", () => {
	it("joins first and last name", () => {
		const user = {
			firstName: "Alice",
			lastName: "Smith",
			email: "alice@example.com",
		};
		expect(toMemberName(user)).toBe("Alice Smith");
	});

	it("handles missing last name", () => {
		const user = {
			firstName: "Alice",
			lastName: null,
			email: "alice@example.com",
		};
		expect(toMemberName(user)).toBe("Alice");
	});

	it("falls back to email when both names are missing", () => {
		const user = {
			firstName: null,
			lastName: null,
			email: "bob@example.com",
		};
		expect(toMemberName(user)).toBe("bob@example.com");
	});

	it("handles empty strings", () => {
		const user = {
			firstName: "",
			lastName: "",
			email: "empty@example.com",
		};
		expect(toMemberName(user)).toBe("empty@example.com");
	});
});
