import { describe, expect, it } from "vitest";
import { parseVariantResponse } from "@/lib/profanity/filipino-detector";

/** the API's own shape, with the substring match that caused the false positive. */
const PEST_IN_A_USERNAME = {
	success: true,
	hasMatch: true,
	matchCount: 1,
	data: [{ variant: "pest", word: "peste", position: 4 }],
};

describe("parseVariantResponse boundary check", () => {
	it("drops a match that starts inside another word", () => {
		const result = parseVariantResponse(PEST_IN_A_USERNAME, "@tempestpxyruz");
		expect(result.isProfane).toBe(false);
		expect(result.matched).toBeUndefined();
	});

	it("keeps a match that begins a word", () => {
		const result = parseVariantResponse(
			{
				success: true,
				hasMatch: true,
				matchCount: 1,
				data: [{ variant: "g4g0", word: "gago", position: 0 }],
			},
			"g4g0 ka talaga",
		);
		expect(result.isProfane).toBe(true);
		expect(result.matched).toEqual(["gago"]);
	});

	it("keeps the endpoint's verdict when no text is supplied", () => {
		// Without the original text there is nothing to bound against, so the
		// parser stays backwards compatible for callers that only have the body.
		const result = parseVariantResponse(PEST_IN_A_USERNAME);
		expect(result.isProfane).toBe(true);
	});
});
