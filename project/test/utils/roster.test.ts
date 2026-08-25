import { describe, expect, it } from "vitest";
import { isRosterContainedIn, isSameRoster } from "@/lib/utils/roster";

describe("isSameRoster", () => {
	it("ignores order", () => {
		/** order is not identity - one side comes from a SQL array_agg and the other from a store, and neither promises an order. */
		expect(isSameRoster(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
	});

	it("ignores duplicates on either side", () => {
		expect(isSameRoster(["a", "a", "b"], ["b", "a"])).toBe(true);
	});

	it("rejects a roster with an extra person", () => {
		expect(isSameRoster(["a", "b"], ["a", "b", "c"])).toBe(false);
		expect(isSameRoster(["a", "b", "c"], ["a", "b"])).toBe(false);
	});

	it("rejects same-size rosters holding different people", () => {
		/** the length shortcut alone would pass this - the case that makes a naive count comparison wrong. */
		expect(isSameRoster(["a", "b"], ["a", "c"])).toBe(false);
	});

	it("treats two empty rosters as the same", () => {
		expect(isSameRoster([], [])).toBe(true);
	});
});

describe("isRosterContainedIn", () => {
	it("is true when every member is already present", () => {
		expect(isRosterContainedIn(["a", "b"], ["a", "b", "c"])).toBe(true);
	});

	it("is true for an exact match", () => {
		expect(isRosterContainedIn(["a", "b"], ["a", "b"])).toBe(true);
	});

	it("is false when one member is missing", () => {
		expect(isRosterContainedIn(["a", "z"], ["a", "b"])).toBe(false);
	});

	it("is false for an empty subset", () => {
		/** deliberate - an empty group has nothing to add, but reporting it "fully applied" would hide the control and leave no sign the group is empty. */
		expect(isRosterContainedIn([], ["a", "b"])).toBe(false);
		expect(isRosterContainedIn([], [])).toBe(false);
	});

	it("accepts any iterable as the container", () => {
		/** the settings hook passes a Set, the DAL passes an array. */
		expect(isRosterContainedIn(["a"], new Set(["a", "b"]))).toBe(true);
	});
});
