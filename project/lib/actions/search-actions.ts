"use server";

import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import { globalSearchDAL } from "@/lib/dal/search";
import type { SearchResults } from "@/lib/types/search";
import { SearchQuerySchema } from "@/lib/validations/search-schema";

/**
 * global search action - handles search queries by gracefully
 * returning empty results for invalid inputs (like single
 * characters) to prevent jarring UI errors while typing.
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
