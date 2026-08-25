import { describe, expect, it } from "vitest";
import { toDueDateEventRange } from "@/lib/utils/calendar-event";

describe("toDueDateEventRange", () => {
	it("returns an all-day event for a midnight due date", () => {
		const midnight = new Date("2026-08-19T00:00:00.000");
		const result = toDueDateEventRange(midnight);

		expect(result.allDay).toBe(true);
		expect(result.start).toEqual(midnight);
		expect(result.end).toEqual(midnight);
	});

	it("returns a timed event with a 1-hour duration for a due date with a specific time", () => {
		const timed = new Date("2026-08-19T14:30:00.000"); // 2:30 PM
		const result = toDueDateEventRange(timed);

		expect(result.allDay).toBe(false);
		expect(result.start).toEqual(timed);

		const expectedEnd = new Date(timed);
		expectedEnd.setHours(15); // +1 hour
		expect(result.end).toEqual(expectedEnd);
	});
});
