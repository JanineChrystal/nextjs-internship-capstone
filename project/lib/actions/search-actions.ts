"use server";

import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { globalSearchDAL } from "@/lib/dal/search";
import type { SearchResults } from "@/lib/types/search";
import { SearchQuerySchema } from "@/lib/validations/search-schema";

/**
 * The global search endpoint.
 *
 * Returns empty results rather than an error when the term is too short or too
 * long. The palette calls this on every settled keystroke, and a validation
 * error for "a" would mean showing the user a red message for the entirely
 * normal act of having typed one character so far.
 *
 * Genuine failures - no session, a database problem - do return an error,
 * because those are worth telling someone about.
 */
export async function globalSearchAction(
	term: string,
): Promise<{ success: boolean; data?: SearchResults; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const parsed = SearchQuerySchema.safeParse(term);
		if (!parsed.success) {
			return {
				success: true,
				data: { projects: [], tasks: [], people: [], hasMore: false },
			};
		}

		return { success: true, data: await globalSearchDAL(parsed.data) };
	} catch (error) {
		console.error("globalSearchAction error:", error);
		return { success: false, error: "Search is unavailable right now" };
	}
}
