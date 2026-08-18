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
	CategoryType,
} from "@/lib/types/category";
import { getCategoryScopeKey, indexCategoryColors } from "@/lib/utils/category";

/**
 * One in-flight palette request per scope, held outside the store because these
 * are promises rather than rendered state.
 *
 * Without it, a board with forty task cards would fire forty identical requests
 * on mount - every badge asks for its palette independently, and none of them
 * can see that another already did.
 */
const inFlightStyleRequests = new Map<string, Promise<void>>();

/**
 * The two ways of reaching categories, behind one interface.
 *
 * Every action in each column takes the same arguments as its counterpart - only
 * the id means something different (a workspace on one side, a project on the
 * other, which the server resolves to *its* workspace). Because the shapes
 * match, the store can pick a column by scope and run one implementation instead
 * of the eight near-identical bodies this file used to carry.
 *
 * This is the strategy pattern in its smallest useful form: the behaviour that
 * varies is selected by data, so the code using it never branches.
 */
const CATEGORY_API = {
	workspace: {
		fetch: getCategoriesAction,
		create: createCategoryAction,
		update: updateCategoryAction,
		remove: deleteCategoryAction,
	},
	project: {
		fetch: getProjectCategoriesAction,
		create: createProjectCategoryAction,
		update: updateProjectCategoryAction,
		remove: deleteProjectCategoryAction,
	},
} as const;

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

	fetchCategories: (workspaceId: string, type: CategoryType) => Promise<void>;
	addCategory: (
		workspaceId: string,
		name: string,
		type: CategoryType,
		color?: string,
	) => Promise<boolean>;
	updateCategory: (
		workspaceId: string,
		oldName: string,
		newName: string,
		newColor: string,
		type: CategoryType,
	) => Promise<boolean>;
	deleteCategory: (
		workspaceId: string,
		categoryName: string,
		type: CategoryType,
	) => Promise<boolean>;

	// Project-scoped equivalents, resolving the project's workspace server-side.
	// The task modal needs these: a member opening a task in a shared project must
	// see that project's categories, not their own.
	fetchProjectCategories: (
		projectId: string,
		type: CategoryType,
	) => Promise<void>;
	addProjectCategory: (
		projectId: string,
		name: string,
		type: CategoryType,
		color?: string,
	) => Promise<boolean>;
	updateProjectCategory: (
		projectId: string,
		oldName: string,
		newName: string,
		newColor: string,
		type: CategoryType,
	) => Promise<boolean>;
	deleteProjectCategory: (
		projectId: string,
		categoryName: string,
		type: CategoryType,
	) => Promise<boolean>;

	// Palette lookups for badges. Read-only as far as the rest of the app is
	// concerned - nothing here writes categories, it only caches their colours.
	ensureCategoryStyles: (scope: CategoryScope) => Promise<void>;
	refreshCategoryStyles: (scope: CategoryScope) => Promise<void>;
}

type StoreSetter = (
	updater: (state: CategoryState) => Partial<CategoryState>,
) => void;

const UNEXPECTED_ERROR = "An unexpected error occurred";

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
	set: StoreSetter,
): Promise<void> {
	const key = getCategoryScopeKey(scope);

	const request = (async () => {
		try {
			const result = await CATEGORY_API[scope.kind].fetch(scope.id, scope.type);

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

export const useCategoryStore = create<CategoryState>((set, get) => {
	/**
	 * Replaces the visible list and refreshes the cached palette for one scope.
	 *
	 * Both halves move together on purpose: badges read colours from
	 * `categoryStyles`, so a list refresh that skipped the palette would leave
	 * them painting values that no longer exist.
	 */
	const loadCategories = async (scope: CategoryScope): Promise<void> => {
		set(() => ({ isLoading: true, error: null }));

		try {
			const result = await CATEGORY_API[scope.kind].fetch(scope.id, scope.type);

			if (!result.success || !result.data) {
				set(() => ({
					error: result.error || "Failed to fetch categories",
					isLoading: false,
				}));
				return;
			}

			const list = result.data as Category[];
			set((state) => ({
				categories: list,
				categoryStyles: {
					...state.categoryStyles,
					[getCategoryScopeKey(scope)]: indexCategoryColors(list),
				},
				isLoading: false,
			}));
		} catch {
			set(() => ({ error: UNEXPECTED_ERROR, isLoading: false }));
		}
	};

	const createCategory = async (
		scope: CategoryScope,
		name: string,
		color?: string,
	): Promise<boolean> => {
		set(() => ({ isLoading: true, error: null }));

		try {
			const result = await CATEGORY_API[scope.kind].create(
				scope.id,
				name,
				scope.type,
				color,
			);

			if (!result.success || !result.data) {
				set(() => ({
					error: result.error || "Failed to create category",
					isLoading: false,
				}));
				return false;
			}

			set((state) => ({
				categories: [...state.categories, result.data as Category],
				isLoading: false,
			}));
			return true;
		} catch {
			set(() => ({ error: UNEXPECTED_ERROR, isLoading: false }));
			return false;
		}
	};

	const renameCategory = async (
		scope: CategoryScope,
		oldName: string,
		newName: string,
		newColor: string,
	): Promise<boolean> => {
		set(() => ({ isLoading: true, error: null }));

		try {
			const result = await CATEGORY_API[scope.kind].update(
				scope.id,
				oldName,
				newName,
				newColor,
				scope.type,
			);

			if (!result.success || !result.data) {
				set(() => ({
					error: result.error || "Failed to update category",
					isLoading: false,
				}));
				return false;
			}

			const updated = result.data as Category;
			set((state) => ({
				categories: state.categories.map((category) =>
					category.name === oldName ? updated : category,
				),
				isLoading: false,
			}));
			return true;
		} catch {
			set(() => ({ error: UNEXPECTED_ERROR, isLoading: false }));
			return false;
		}
	};

	const removeCategory = async (
		scope: CategoryScope,
		categoryName: string,
	): Promise<boolean> => {
		set(() => ({ isLoading: true, error: null }));

		try {
			const result = await CATEGORY_API[scope.kind].remove(
				scope.id,
				categoryName,
				scope.type,
			);

			if (!result.success) {
				set(() => ({
					error: result.error || "Failed to delete category",
					isLoading: false,
				}));
				return false;
			}

			set((state) => ({
				categories: state.categories.filter(
					(category) => category.name !== categoryName,
				),
				isLoading: false,
			}));
			return true;
		} catch {
			set(() => ({ error: UNEXPECTED_ERROR, isLoading: false }));
			return false;
		}
	};

	return {
		categories: [],
		categoryStyles: {},
		isLoading: false,
		error: null,

		fetchCategories: (workspaceId, type) =>
			loadCategories({ kind: "workspace", id: workspaceId, type }),
		addCategory: (workspaceId, name, type, color) =>
			createCategory({ kind: "workspace", id: workspaceId, type }, name, color),
		updateCategory: (workspaceId, oldName, newName, newColor, type) =>
			renameCategory(
				{ kind: "workspace", id: workspaceId, type },
				oldName,
				newName,
				newColor,
			),
		deleteCategory: (workspaceId, categoryName, type) =>
			removeCategory(
				{ kind: "workspace", id: workspaceId, type },
				categoryName,
			),

		fetchProjectCategories: (projectId, type) =>
			loadCategories({ kind: "project", id: projectId, type }),
		addProjectCategory: (projectId, name, type, color) =>
			createCategory({ kind: "project", id: projectId, type }, name, color),
		updateProjectCategory: (projectId, oldName, newName, newColor, type) =>
			renameCategory(
				{ kind: "project", id: projectId, type },
				oldName,
				newName,
				newColor,
			),
		deleteProjectCategory: (projectId, categoryName, type) =>
			removeCategory({ kind: "project", id: projectId, type }, categoryName),

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
		 * painting the old colour until the next full page load, which is exactly
		 * the "editing a category changes nothing" symptom this work set out to fix.
		 */
		refreshCategoryStyles: (scope) => loadCategoryStyles(scope, set),
	};
});
