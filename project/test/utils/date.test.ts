import { describe, expect, it } from "vitest";
import {
	formatDate,
	groupByDay,
	parseTaskDate,
	toApiDateInput,
	toDayHeading,
} from "@/lib/utils/date";

describe("formatDate", () => {
	it("returns '--' for null, undefined, or '--'", () => {
		expect(formatDate(null)).toBe("--");
		expect(formatDate(undefined)).toBe("--");
		expect(formatDate("--")).toBe("--");
	});

	it("returns raw string for unparseable input", () => {
		expect(formatDate("not-a-date")).toBe("not-a-date");
	});

	it("formats valid dates as MM/dd/yyyy", () => {
		expect(formatDate("2026-08-19T10:00:00.000Z")).toMatch(/0?8\/19\/2026/);
	});
});

describe("toApiDateInput", () => {
	it("strips the placeholder '--'", () => {
		expect(toApiDateInput("--")).toBeUndefined();
	});

	it("passes through valid strings", () => {
		expect(toApiDateInput("2026-08-19T10:00:00.000Z")).toBe(
			"2026-08-19T10:00:00.000Z",
		);
	});

	it("returns undefined for undefined", () => {
		expect(toApiDateInput(undefined)).toBeUndefined();
	});
});

describe("parseTaskDate", () => {
	it("returns null for empty, placeholder, or invalid", () => {
		expect(parseTaskDate(undefined)).toBeNull();
		expect(parseTaskDate("")).toBeNull();
		expect(parseTaskDate("--")).toBeNull();
		expect(parseTaskDate("invalid")).toBeNull();
	});

	it("returns a Date for valid ISO strings", () => {
		const date = parseTaskDate("2026-08-19T10:00:00.000Z");
		expect(date).toBeInstanceOf(Date);
		expect(date?.getFullYear()).toBe(2026);
	});
});

describe("toDayHeading", () => {
	it("returns Today for the current date", () => {
		const today = new Date();
		expect(toDayHeading(today)).toBe("Today");
	});

	it("returns Yesterday for the previous date", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(toDayHeading(yesterday)).toBe("Yesterday");
	});

	it("returns formatted date for other dates", () => {
		const past = new Date("2026-01-01T10:00:00.000Z");
		expect(toDayHeading(past)).not.toBe("Today");
		expect(toDayHeading(past)).not.toBe("Yesterday");
	});
});

describe("groupByDay", () => {
	it("groups items by local calendar day", () => {
		const items = [
			{ id: "1", createdAt: new Date("2026-08-19T10:00:00.000") },
			{ id: "2", createdAt: new Date("2026-08-19T15:00:00.000") },
			{ id: "3", createdAt: new Date("2026-08-20T10:00:00.000") },
		];

		const groups = groupByDay(items);

		expect(groups.length).toBe(2);
		expect(groups[0].items.length).toBe(2);
		expect(groups[1].items.length).toBe(1);
	});

	it("handles empty lists", () => {
		expect(groupByDay([])).toEqual([]);
	});
});
