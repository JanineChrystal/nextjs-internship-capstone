import type { SearchResult } from "@/lib/types/search";

/**
 * search mapping - maps database rows into search hits using specialized
 * mappers per entity kind, ensuring product-specific subtitle rules (e.g.
 * category vs. project name) are properly applied.
 */

export function toProjectSearchResult(row: {
	id: string;
	name: string;
	category: string | null;
}): SearchResult {
	return {
		id: row.id,
		kind: "project",
		title: row.name,
		subtitle: row.category,
		href: `/projects/${row.id}`,
	};
}

/**
 * to task search result - maps a task row into a search hit, utilizing query
 * parameters to open the task modal directly upon routing to the project page.
 */
export function toTaskSearchResult(row: {
	id: string;
	name: string;
	projectId: string;
	projectName: string | null;
}): SearchResult {
	return {
		id: row.id,
		kind: "task",
		title: row.name,
		subtitle: row.projectName,
		href: `/projects/${row.projectId}?task=${row.id}`,
	};
}

export function toPersonSearchResult(row: {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
}): SearchResult {
	const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();

	return {
		id: row.id,
		kind: "person",
		// Falling back to the email rather than showing an empty row: a user whose
		// Clerk profile has no name yet is still a real person worth finding.
		title: name || row.email,
		subtitle: name ? row.email : null,
		href: `/profile/${row.id}`,
	};
}
