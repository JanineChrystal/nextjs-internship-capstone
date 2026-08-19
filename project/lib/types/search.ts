/**
 * What global search can find.
 *
 * A closed union rather than a free-text kind, so the renderer's switch has to
 * handle every group and adding a fourth becomes a compile error rather than a
 * result that renders as nothing.
 */
export type SearchResultKind = "project" | "task" | "person";

/**
 * One hit, in the shape the palette renders.
 *
 * Every kind is flattened to the same fields on purpose. The alternative - a
 * discriminated union with different fields per kind - would mean the list
 * component branching on kind for layout as well as for the icon, and the three
 * rows are meant to look alike.
 *
 * `href` is resolved on the server rather than built in the browser, so there is
 * one place that knows a task lives at /projects/{projectId} and not at
 * /tasks/{id}. A route change then breaks a compile rather than a link.
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
