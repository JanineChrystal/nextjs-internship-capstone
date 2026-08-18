import { create } from "zustand";
import {
	createCategoryAction,
	createProjectCategoryAction,
	deleteCategoryAction,
	deleteProjectCategoryAction,
	getCategoriesAction,
	getProjectCategoriesAction,
	updateCategoryAction,
	updateProjectCategoryAction,
} from "@/lib/actions/category-actions";
import type {
	Category,
	CategoryColorMap,
	CategoryScope,
} from "@/lib/types/category";
import { getCategoryScopeKey, indexCategoryColors } from "@/lib/utils/category";

// Re-exported so the components that already import Category from this store
// keep working while the codebase moves onto @/lib/types.
export type { Category };

/**
 * One in-flight palette request per scope, held outside the store because these
 * are promises rather than rendered state.
 *
 * Without it, a board with forty task cards would fire forty identical requests
 * on mount - every badge asks for its palette independently, and none of them
 * can see that another already did.
 */
const inFlightStyleRequests = new Map<string, Promise<void>>();

interface CategoryState {
	categories: Category[];
	/**
	 * Scope key to (category name -> hex colour). Separate from `categories`
	 * because that array holds a single scope and is overwritten by whichever
	 * fetch ran last, whereas badges from several scopes can be on screen at once.
	 */
	categoryStyles: Record<string, CategoryColorMap>;
	isLoading: boolean;
	error: string | null;

	// Actions
	fetchCategories: (
		workspaceId: string,
		type: "project" | "task",
	) => Promise<void>;
	addCategory: (
		workspaceId: string,
		name: string,
		type: "project" | "task",
		color?: string,
	) => Promise<boolean>;
	updateCategory: (
		workspaceId: string,
		oldName: string,
		newName: string,
		newColor: string,
		type: "project" | "task",
	) => Promise<boolean>;
	deleteCategory: (
		workspaceId: string,
		categoryName: string,
		type: "project" | "task",
	) => Promise<boolean>;

	// Project-scoped equivalents, resolving the project's workspace server-side.
	fetchProjectCategories: (
		projectId: string,
		type: "project" | "task",
	) => Promise<void>;
	addProjectCategory: (
		projectId: string,
		name: string,
		type: "project" | "task",
		color?: string,
	) => Promise<boolean>;
	updateProjectCategory: (
		projectId: string,
		oldName: string,
		newName: string,
		newColor: string,
		type: "project" | "task",
	) => Promise<boolean>;
	deleteProjectCategory: (
		projectId: string,
		categoryName: string,
		type: "project" | "task",
	) => Promise<boolean>;

	// Palette lookups for badges. Read-only as far as the rest of the app is
	// concerned - nothing here writes categories, it only caches their colours.
	ensureCategoryStyles: (scope: CategoryScope) => Promise<void>;
	refreshCategoryStyles: (scope: CategoryScope) => Promise<void>;
}

/**
 * Loads one scope's palette into the cache.
 *
 * Shared by both public entry points, which differ only in whether they check
 * the cache first. A failure is swallowed on purpose: a badge with no colour
 * still renders using its generated palette, so a palette request is never worth
 * interrupting the page for.
 */
async function loadCategoryStyles(
	scope: CategoryScope,
	set: (updater: (state: CategoryState) => Partial<CategoryState>) => void,
): Promise<void> {
	const key = getCategoryScopeKey(scope);

	const request = (async () => {
		try {
			const result =
				scope.kind === "project"
					? await getProjectCategoriesAction(scope.id, scope.type)
					: await getCategoriesAction(scope.id, scope.type);

			if (result.success && result.data) {
				const colors = indexCategoryColors(result.data as Category[]);
				set((state) => ({
					categoryStyles: { ...state.categoryStyles, [key]: colors },
				}));
			}
		} catch {
			// Left uncached rather than cached empty, so navigating back retries.
		} finally {
			inFlightStyleRequests.delete(key);
		}
	})();

	inFlightStyleRequests.set(key, request);
	return request;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
	categories: [],
	categoryStyles: {},
	isLoading: false,
	error: null,

	fetchCategories: async (workspaceId, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await getCategoriesAction(workspaceId, type);
			if (result.success && result.data) {
				const list = result.data as Category[];
				set((state) => ({
					categories: list,
					categoryStyles: {
						...state.categoryStyles,
						[getCategoryScopeKey({ kind: "workspace", id: workspaceId, type })]:
							indexCategoryColors(list),
					},
					isLoading: false,
				}));
			} else {
				set({
					error: result.error || "Failed to fetch categories",
					isLoading: false,
				});
			}
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
		}
	},

	addCategory: async (workspaceId, name, type, color) => {
		set({ isLoading: true, error: null });
		try {
			const result = await createCategoryAction(workspaceId, name, type, color);
			if (result.success && result.data) {
				set((state) => ({
					categories: [...state.categories, result.data as Category],
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to create category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	updateCategory: async (workspaceId, oldName, newName, newColor, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await updateCategoryAction(
				workspaceId,
				oldName,
				newName,
				newColor,
				type,
			);
			if (result.success && result.data) {
				const updatedCategory = result.data as Category;
				set((state) => ({
					categories: state.categories.map((c) =>
						c.name === oldName ? updatedCategory : c,
					),
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to update category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	deleteCategory: async (workspaceId, categoryName, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await deleteCategoryAction(
				workspaceId,
				categoryName,
				type,
			);
			if (result.success) {
				set((state) => ({
					categories: state.categories.filter((c) => c.name !== categoryName),
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to delete category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	// Project-scoped variants. These target the workspace that owns the project
	// rather than the caller's own, which is what the task modal needs: a member
	// opening a task in a shared project must see that project's categories.
	fetchProjectCategories: async (projectId, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await getProjectCategoriesAction(projectId, type);
			if (result.success && result.data) {
				const list = result.data as Category[];
				set((state) => ({
					categories: list,
					categoryStyles: {
						...state.categoryStyles,
						[getCategoryScopeKey({ kind: "project", id: projectId, type })]:
							indexCategoryColors(list),
					},
					isLoading: false,
				}));
			} else {
				set({
					error: result.error || "Failed to fetch categories",
					isLoading: false,
				});
			}
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
		}
	},

	addProjectCategory: async (projectId, name, type, color) => {
		set({ isLoading: true, error: null });
		try {
			const result = await createProjectCategoryAction(
				projectId,
				name,
				type,
				color,
			);
			if (result.success && result.data) {
				set((state) => ({
					categories: [...state.categories, result.data as Category],
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to create category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	updateProjectCategory: async (
		projectId,
		oldName,
		newName,
		newColor,
		type,
	) => {
		set({ isLoading: true, error: null });
		try {
			const result = await updateProjectCategoryAction(
				projectId,
				oldName,
				newName,
				newColor,
				type,
			);
			if (result.success && result.data) {
				const updatedCategory = result.data as Category;
				set((state) => ({
					categories: state.categories.map((c) =>
						c.name === oldName ? updatedCategory : c,
					),
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to update category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	deleteProjectCategory: async (projectId, categoryName, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await deleteProjectCategoryAction(
				projectId,
				categoryName,
				type,
			);
			if (result.success) {
				set((state) => ({
					categories: state.categories.filter((c) => c.name !== categoryName),
					isLoading: false,
				}));
				return true;
			}
			set({
				error: result.error || "Failed to delete category",
				isLoading: false,
			});
			return false;
		} catch {
			set({ error: "An unexpected error occurred", isLoading: false });
			return false;
		}
	},

	/**
	 * Loads a scope's palette unless it is already cached or already being
	 * fetched. Called by every category badge on mount; the two guards are what
	 * turn that into one request per scope.
	 */
	ensureCategoryStyles: async (scope) => {
		const key = getCategoryScopeKey(scope);

		if (get().categoryStyles[key]) return;

		const pending = inFlightStyleRequests.get(key);
		if (pending) return pending;

		return loadCategoryStyles(scope, set);
	},

	/**
	 * Reloads a scope's palette regardless of what is cached, for after someone
	 * edits colours in Manage Categories. Without it the badges would keep
	 * painting the old colour until the next full page load, which is exactly the
	 * "editing a category changes nothing" symptom this work set out to fix.
	 */
	refreshCategoryStyles: async (scope) => {
		return loadCategoryStyles(scope, set);
	},
}));
