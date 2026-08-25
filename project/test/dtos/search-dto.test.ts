import { describe, expect, it } from "vitest";
import {
	toPersonSearchResult,
	toProjectSearchResult,
	toTaskSearchResult,
} from "@/lib/dtos/search-dto";

describe("toProjectSearchResult", () => {
	it("builds correct href, kind, title, subtitle", () => {
		const row = { id: "p1", name: "Alpha", category: "Web" };
		const result = toProjectSearchResult(row);
		expect(result).toEqual({
			id: "p1",
			kind: "project",
			title: "Alpha",
			subtitle: "Web",
			href: "/projects/p1",
		});
	});
});

describe("toTaskSearchResult", () => {
	it("builds href with query param ?task=", () => {
		const row = {
			id: "t1",
			name: "Fix bug",
			projectId: "p1",
			projectName: "Alpha",
		};
		const result = toTaskSearchResult(row);
		expect(result).toEqual({
			id: "t1",
			kind: "task",
			title: "Fix bug",
			subtitle: "Alpha",
			href: "/projects/p1?task=t1",
		});
	});
});

describe("toPersonSearchResult", () => {
	it("uses name when present and sets subtitle to email", () => {
		const row = {
			id: "u1",
			firstName: "Alice",
			lastName: "Smith",
			email: "alice@example.com",
		};
		const result = toPersonSearchResult(row);
		expect(result.title).toBe("Alice Smith");
		expect(result.subtitle).toBe("alice@example.com");
	});

	it("falls back to email when name is missing and nulls subtitle", () => {
		const row = {
			id: "u1",
			firstName: null,
			lastName: null,
			email: "bob@example.com",
		};
		const result = toPersonSearchResult(row);
		expect(result.title).toBe("bob@example.com");
		expect(result.subtitle).toBeNull();
	});
});
