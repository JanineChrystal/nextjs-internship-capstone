export interface Category {
	id?: string;
	name: string;
	color: string;
	type?: CategoryType;
}

export type CategoryType = "project" | "task";

/**
 * Which set of categories a lookup wants.
 *
 * Categories belong to a workspace, but the two ways of reaching them are not
 * interchangeable. A "project" scope resolves the workspace that owns the
 * project server-side, which is what a member viewing someone else's board
 * needs; a "workspace" scope resolves the caller's own. Reaching for the wrong
 * one is what previously left members with an empty category dropdown.
 */
export interface CategoryScope {
	kind: "workspace" | "project";
	id: string;
	type: CategoryType;
}

/**
 * Category name (lower-cased) to hex colour, for one scope.
 */
export type CategoryColorMap = Record<string, string>;
