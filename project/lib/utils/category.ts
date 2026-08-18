import type {
	Category,
	CategoryColorMap,
	CategoryScope,
} from "@/lib/types/category";

/**
 * Stable cache key for a scope.
 *
 * Colours for different scopes have to live side by side. The store keeps a
 * single shared `categories` array that whichever fetch ran last overwrites, so
 * without a per-scope key a project board and the projects list would keep
 * stealing each other's palette.
 */
export function getCategoryScopeKey(scope: CategoryScope): string {
	return `${scope.kind}:${scope.id}:${scope.type}`;
}

/**
 * Categories are matched by name rather than id, because that is what the rows
 * referencing them store - `tasks.category` and `projects.category` are plain
 * text. Lower-casing both sides keeps "Design" on a task card matching the
 * "design" row someone typed in Manage Categories.
 */
export function getCategoryColorKey(name: string): string {
	return name.trim().toLowerCase();
}

export function indexCategoryColors(list: Category[]): CategoryColorMap {
	const map: CategoryColorMap = {};
	for (const category of list) {
		if (category.color)
			map[getCategoryColorKey(category.name)] = category.color;
	}
	return map;
}
