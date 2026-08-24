/**
 * search result kind - defines a closed union of supported global search
 * domains, ensuring exhaustive switch handling in the renderer and producing
 * a compile error for unhandled kinds.
 */
export type SearchResultKind = "project" | "task" | "person";

/**
 * search result - describes a single search hit flattened for the palette,
 * resolving route URLs server-side to maintain a single source of truth for
 * entity locations.
 */
export interface SearchResult {
	id: string;
	kind: SearchResultKind;
	title: string;
	subtitle: string | null;
	href: string;
}

export interface SearchResults {
	projects: SearchResult[];
	tasks: SearchResult[];
	people: SearchResult[];
	hasMore: boolean;
}
