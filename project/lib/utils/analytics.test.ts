import { describe, expect, it } from "vitest";
import {
	countPerDay,
	MILLISECONDS_PER_DAY,
	tallyBy,
	toAverageDays,
	toPercentage,
	toVelocityPerWeek,
} from "./analytics";

const DAY = MILLISECONDS_PER_DAY;

describe("toPercentage", () => {
	it("rounds to a whole percent", () => {
		expect(toPercentage(1, 3)).toBe(33);
		expect(toPercentage(2, 3)).toBe(67);
	});
	it("returns 0 for an empty whole instead of NaN", () => {
		expect(toPercentage(0, 0)).toBe(0);
	});
	it("handles a fully complete project", () => {
		expect(toPercentage(8, 8)).toBe(100);
	});
});

describe("toVelocityPerWeek", () => {
	it("divides a 28-day count into 4 weeks", () => {
		expect(toVelocityPerWeek(34, 28)).toBe(8.5);
	});
	it("passes a 7-day window through unchanged", () => {
		expect(toVelocityPerWeek(6, 7)).toBe(6);
	});
	it("returns 0 for a zero-length window", () => {
		expect(toVelocityPerWeek(10, 0)).toBe(0);
	});
});

describe("toAverageDays", () => {
	it("averages spans in days to one decimal", () => {
		expect(toAverageDays([2 * DAY, 3 * DAY])).toBe(2.5);
	});
	it("drops corrupt negative spans rather than clamping them to zero", () => {
		expect(toAverageDays([4 * DAY, -10 * DAY])).toBe(4);
	});
	it("returns 0 when nothing has been completed", () => {
		expect(toAverageDays([])).toBe(0);
	});
});

describe("countPerDay", () => {
	const now = new Date(2026, 7, 18, 15, 0, 0);

	it("zero-fills every day in the window", () => {
		const result = countPerDay([], 14, now);
		expect(result).toHaveLength(14);
		expect(result.every((day) => day.tasksCompleted === 0)).toBe(true);
	});

	it("puts the oldest day first and today last", () => {
		const result = countPerDay([], 3, now);
		expect(result.map((day) => day.date)).toEqual([
			"2026-08-16",
			"2026-08-17",
			"2026-08-18",
		]);
	});

	it("buckets by LOCAL day, so an early-morning event is not filed yesterday", () => {
		// 07:00 local on the 18th is the 17th in UTC for UTC+8.
		const early = new Date(2026, 7, 18, 7, 0, 0);
		const result = countPerDay([early], 3, now);
		expect(result.at(-1)?.tasksCompleted).toBe(1);
	});

	it("ignores timestamps older than the window instead of piling them on day one", () => {
		const ancient = new Date(2026, 0, 1);
		const result = countPerDay([ancient], 3, now);
		expect(result.reduce((sum, day) => sum + day.tasksCompleted, 0)).toBe(0);
	});
});

describe("tallyBy", () => {
	const rows = [
		{ status: "In Progress" },
		{ status: "Completed" },
		{ status: "Completed" },
	];

	it("honours the preferred order rather than insertion order", () => {
		const result = tallyBy(rows, (row) => row.status, [
			"Not Started",
			"In Progress",
			"Completed",
		]);
		expect(result).toEqual([
			{ name: "In Progress", value: 1 },
			{ name: "Completed", value: 2 },
		]);
	});

	it("drops preferred keys that ended up empty", () => {
		const result = tallyBy(rows, (row) => row.status, ["Not Started"]);
		expect(result.some((slice) => slice.name === "Not Started")).toBe(false);
	});

	it("still counts keys that were not in the preferred list", () => {
		const result = tallyBy(rows, (row) => row.status, []);
		expect(result).toHaveLength(2);
	});
});
