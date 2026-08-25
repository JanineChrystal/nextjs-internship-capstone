import { describe, expect, it } from "vitest";
import {
	parseCheckResponse,
	parseVariantResponse,
} from "@/lib/profanity/filipino-detector";

/**
 * The response parsers, against the shapes the live API actually returns.
 *
 * These payloads were copied from real responses, not from the documentation -
 * probing the deployment is what revealed that the two endpoints use different
 * verdict fields and that /check does not apply leetspeak variants at all.
 *
 * The detectors themselves are not unit tested: asserting that fetch was called
 * with a particular body mostly asserts the code is written the way it is
 * written. `pnpm check:profanity` exercises the real service instead.
 */

describe("parseCheckResponse", () => {
	it("reads a clean verdict", () => {
		const result = parseCheckResponse({
			success: true,
			hasProfanity: false,
			count: 0,
			data: [],
		});
		expect(result.isProfane).toBe(false);
	});

	it("reads a profane verdict and names the word", () => {
		const result = parseCheckResponse({
			success: true,
			hasProfanity: true,
			count: 1,
			data: [
				{
					word: "gago",
					language: "filipino",
					region: null,
					severity: "medium",
				},
			],
		});
		expect(result.isProfane).toBe(true);
		expect(result.matched).toEqual(["gago"]);
	});

	it("reads a Visayan hit", () => {
		const result = parseCheckResponse({
			success: true,
			hasProfanity: true,
			count: 1,
			data: [
				{
					word: "yawa",
					language: "regional",
					region: "visayan",
					severity: "medium",
				},
			],
		});
		expect(result.isProfane).toBe(true);
		expect(result.matched).toEqual(["yawa"]);
	});

	it("throws rather than assuming clean when the field is missing", () => {
		// The failure this prevents: silently reading an unrecognised shape as
		// "not profane" means moderation stops working and nothing reports it.
		expect(() => parseCheckResponse({ success: true })).toThrow(/hasProfanity/);
	});

	it("throws on a non-object response", () => {
		expect(() => parseCheckResponse("nope")).toThrow(/non-object/);
	});
});

describe("parseVariantResponse", () => {
	it("uses hasMatch, not hasProfanity", () => {
		// The two endpoints genuinely differ. Assuming they agreed would return
		// "clean" forever from the leetspeak check.
		const result = parseVariantResponse({
			success: true,
			hasMatch: true,
			matchCount: 1,
			data: [{ variant: "g4g0", word: "gago", position: 0 }],
		});
		expect(result.isProfane).toBe(true);
	});

	it("reports the BASE word, not the obfuscated variant", () => {
		// A moderator can act on "gago"; "g4g0" just makes them decode it.
		const result = parseVariantResponse({
			success: true,
			hasMatch: true,
			matchCount: 1,
			data: [{ variant: "g4g0", word: "gago", position: 0 }],
		});
		expect(result.matched).toEqual(["gago"]);
	});

	it("reads a clean lookup", () => {
		const result = parseVariantResponse({
			success: true,
			hasMatch: false,
			matchCount: 0,
			data: [],
		});
		expect(result.isProfane).toBe(false);
		expect(result.matched).toBeUndefined();
	});

	it("throws when hasMatch is absent", () => {
		expect(() =>
			parseVariantResponse({ success: true, hasProfanity: true }),
		).toThrow(/hasMatch/);
	});
});
