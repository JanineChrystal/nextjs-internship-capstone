import { z } from "zod";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/constants/search";

/**
 * The one definition of a searchable query, shared by the palette and the
 * action.
 *
 * The client already refuses to send anything shorter than the minimum, but the
 * action re-validates because a server action is a public HTTP endpoint. The
 * upper bound matters more than it looks: the query becomes an ILIKE pattern,
 * and an unbounded string is an unbounded pattern to match against every row.
 */
export const SearchQuerySchema = z
	.string()
	.trim()
	.min(SEARCH_MIN_LENGTH, `Type at least ${SEARCH_MIN_LENGTH} characters`)
	.max(SEARCH_MAX_LENGTH, "Search term is too long");

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
