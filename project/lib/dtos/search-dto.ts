import type { SearchResult } from "@/lib/types/search";

/**
 * Mapping database rows into search hits.
 *
 * Each row type gets its own mapper rather than one generic function, because
 * what counts as the subtitle differs per kind and is a product decision, not a
 * mechanical one: a task is best identified by the project it is in, a project
 * by its category, and a person by their email.
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
 * A task has no page of its own, so it links to its project.
 *
 * `?task={id}` is carried so the project page can open that task's modal on
 * arrival - without it, finding a task by search would drop you on a board and
 * leave you to spot it yourself, which is most of the work you just asked the
 * search to do.
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
