import { describe, expect, it } from "vitest";
import {
	findLocalFilipinoProfanity,
	matchesFilipinoWord,
} from "@/lib/profanity/filipino-wordlist";

describe("matchesFilipinoWord", () => {
	it("matches a word standing on its own", () => {
		expect(matchesFilipinoWord("tangina naman", "tangina")).toBe(true);
	});

	it("matches a suffixed form", () => {
		// Tagalog attaches suffixes, so the boundary is left-only. Requiring one
		// on both sides would miss the forms people actually type.
		expect(matchesFilipinoWord("tanginang buhay", "tangina")).toBe(true);
	});

	it("refuses a match inside another word", () => {
		// The regression: "@tempestpxyruz" was flagged because "pest" sits inside
		// it. A match has to begin a word.
		expect(matchesFilipinoWord("@tempestpxyruz", "piste")).toBe(false);
		expect(matchesFilipinoWord("kupalitan", "pakyu")).toBe(false);
	});

	it("treats an @ as a boundary, not a letter", () => {
		expect(matchesFilipinoWord("@tangina", "tangina")).toBe(true);
	});

	it("is case insensitive", () => {
		expect(matchesFilipinoWord("TANGINA", "tangina")).toBe(true);
	});
});

describe("findLocalFilipinoProfanity", () => {
	it("finds what the remote API misses", () => {
		// Measured against the live service: both /check and /variants/lookup
		// return clean for "tangina". The local list is why it is caught at all.
		expect(findLocalFilipinoProfanity("tangina")).toContain("tangina");
	});

	it("leaves ordinary text alone", () => {
		expect(findLocalFilipinoProfanity("Sample")).toEqual([]);
		expect(findLocalFilipinoProfanity("Dito oh @tempestpxyruz")).toEqual([]);
		expect(findLocalFilipinoProfanity("assignment classic bass")).toEqual([]);
	});
});
