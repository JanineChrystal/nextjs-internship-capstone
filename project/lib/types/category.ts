export interface Category {
	id?: string;
	name: string;
	color: string;
	type?: CategoryType;
}

export type CategoryType = "project" | "task";

/**
 * category scope - specifies the resolution context for category lookups to
 * prevent empty dropdowns, distinguishing between a caller's own 'workspace'
 * and a specific 'project' owned by another workspace.
 */
export interface CategoryScope {
	kind: "workspace" | "project";
	id: string;
	type: CategoryType;
}

/**
 * category color map - maps lower-cased category names to their corresponding
 * hex colors within a specific scope.
 */
export type CategoryColorMap = Record<string, string>;
