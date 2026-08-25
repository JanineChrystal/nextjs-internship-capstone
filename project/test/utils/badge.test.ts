import { describe, expect, it } from "vitest";
import { getCategoryBadgeStyle, getDynamicBadgeColor } from "@/lib/utils/badge";

describe("getDynamicBadgeColor", () => {
	it("returns the same colour for the same text on every call", () => {
		expect(getDynamicBadgeColor("Design")).toBe(getDynamicBadgeColor("Design"));
	});

	it("returns different colours for clearly different texts", () => {
		/** verified pair - a collision is possible with enough entries, so these two were checked against the real palette. */
		expect(getDynamicBadgeColor("Alpha")).not.toBe(
			getDynamicBadgeColor("Beta"),
		);
	});

	it("spreads categories across the palette rather than favouring one", () => {
		/** spread, not just non-empty - a function returning one colour for everything would pass a string-only assertion. */
		const labels = [
			"Design",
			"Engineering",
			"Marketing",
			"Research",
			"Operations",
			"Finance",
			"Legal",
			"Support",
		];
		const distinct = new Set(labels.map(getDynamicBadgeColor));

		expect(distinct.size).toBeGreaterThan(1);
	});

	it("always returns a non-empty string", () => {
		for (const text of ["", "a", "Research", "Very long category name here!"]) {
			expect(getDynamicBadgeColor(text).length).toBeGreaterThan(0);
		}
	});
});

describe("getCategoryBadgeStyle", () => {
	it("returns undefined for null", () => {
		expect(getCategoryBadgeStyle(null)).toBeUndefined();
	});

	it("returns undefined for undefined", () => {
		expect(getCategoryBadgeStyle(undefined)).toBeUndefined();
	});

	it("returns undefined for an empty string", () => {
		expect(getCategoryBadgeStyle("")).toBeUndefined();
	});

	it("returns undefined for a 3-digit hex colour", () => {
		expect(getCategoryBadgeStyle("#abc")).toBeUndefined();
	});

	it("returns undefined for a colour without the leading #", () => {
		expect(getCategoryBadgeStyle("ff0000")).toBeUndefined();
	});

	it("returns undefined for a named colour", () => {
		expect(getCategoryBadgeStyle("red")).toBeUndefined();
	});

	it("returns correct styles for a valid #rrggbb colour", () => {
		const style = getCategoryBadgeStyle("#7c3aed");
		expect(style).toBeDefined();
		expect(style?.color).toBe("#7c3aed");
		expect(style?.backgroundColor).toBe("#7c3aed1f");
		expect(style?.borderColor).toBe("#7c3aed52");
	});

	it("is case-insensitive for the hex digits", () => {
		const upper = getCategoryBadgeStyle("#7C3AED");
		expect(upper).toBeDefined();
		expect(upper?.color).toBe("#7C3AED");
	});
});
