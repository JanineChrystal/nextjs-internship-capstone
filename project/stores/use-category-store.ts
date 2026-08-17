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

export interface Category {
	id?: string;
	name: string;
	color: string;
	type?: "project" | "task";
}

interface CategoryState {
	categories: Category[];
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
}

export const useCategoryStore = create<CategoryState>((set) => ({
	categories: [],
	isLoading: false,
	error: null,

	fetchCategories: async (workspaceId, type) => {
		set({ isLoading: true, error: null });
		try {
			const result = await getCategoriesAction(workspaceId, type);
			if (result.success && result.data) {
				set({ categories: result.data as Category[], isLoading: false });
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
				set({ categories: result.data as Category[], isLoading: false });
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
}));
