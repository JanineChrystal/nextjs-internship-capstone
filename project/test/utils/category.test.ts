import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/types/category";
import {
	getCategoryColorKey,
	getCategoryScopeKey,
	indexCategoryColors,
} from "@/lib/utils/category";

describe("getCategoryScopeKey", () => {
	it("builds a string with kind, id, and type", () => {
		expect(
			getCategoryScopeKey({ kind: "project", id: "p1", type: "task" }),
		).toBe("project:p1:task");
		expect(
			getCategoryScopeKey({ kind: "workspace", id: "w1", type: "project" }),
		).toBe("workspace:w1:project");
	});
});

describe("getCategoryColorKey", () => {
	it("trims and lowercases the category name", () => {
		expect(getCategoryColorKey(" Design ")).toBe("design");
		expect(getCategoryColorKey("FRONTEND")).toBe("frontend");
		expect(getCategoryColorKey("UI/UX Design")).toBe("ui/ux design");
	});
});

describe("indexCategoryColors", () => {
	it("builds a Map mapping lowercased names to colours", () => {
		const categories: Category[] = [
			{ id: "1", name: "Design", color: "#ff0000" },
			{ id: "2", name: "Backend", color: "#00ff00" },
		];
		const map = indexCategoryColors(categories);
		expect(map.design).toBe("#ff0000");
		expect(map.backend).toBe("#00ff00");
	});

	it("skips entries with no colour", () => {
		const categories: Category[] = [
			{ id: "1", name: "Design", color: "#ff0000" },
			{ id: "2", name: "Backend", color: "" },
			{ id: "3", name: "Frontend", color: "" }, // undefined color
		];
		const map = indexCategoryColors(categories);
		expect("design" in map).toBe(true);
		expect("backend" in map).toBe(false);
		expect("frontend" in map).toBe(false);
	});
});
