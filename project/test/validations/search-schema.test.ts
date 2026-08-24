import { describe, expect, it } from "vitest";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/constants/search";
import { SearchQuerySchema } from "@/lib/validations/search-schema";

describe("SearchQuerySchema", () => {
	it("accepts valid queries", () => {
		expect(SearchQuerySchema.safeParse("ab").success).toBe(true);
		expect(SearchQuerySchema.safeParse("Project X").success).toBe(true);
	});

	it("rejects queries shorter than MIN_LENGTH", () => {
		const short = "A".repeat(SEARCH_MIN_LENGTH - 1);
		expect(SearchQuerySchema.safeParse(short).success).toBe(false);
		expect(SearchQuerySchema.safeParse("").success).toBe(false);
	});

	it("rejects queries longer than MAX_LENGTH", () => {
		const long = "A".repeat(SEARCH_MAX_LENGTH + 1);
		expect(SearchQuerySchema.safeParse(long).success).toBe(false);
	});

	it("trims whitespace before checking length", () => {
		// " a " becomes "a" which is 1 char (too short)
		expect(SearchQuerySchema.safeParse(" a ").success).toBe(false);
	});
});
