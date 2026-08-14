import { create } from "zustand";
import {
	createCategoryAction,
	deleteCategoryAction,
	getCategoriesAction,
	updateCategoryAction,
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
}));
