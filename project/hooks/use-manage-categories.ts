"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type {
	Category,
	CategoryScope,
	CategoryType,
} from "@/lib/types/category";
import {
	type EditCategoryFormValues,
	EditCategorySchema,
} from "@/lib/validations/category-schema";
import { useCategoryStore } from "@/stores/use-category-store";

interface UseManageCategoriesParams {
	type: CategoryType;
	workspaceId: string;
	projectId?: string;
}

/**
 * Everything the Manage Categories modal does that is not rendering.
 *
 * Pulled out of the component because it had grown six `useState` calls plus two
 * async handlers, which made it hard to see the markup at all. The component now
 * reads as a list of what is on screen; the rules for editing live here.
 *
 * Note which state uses which tool. `editingRowId` and `categoryToDelete` are UI
 * position - which row is open, which dialog is up - so they stay `useState`.
 * The name and colour are validated user input, so they belong to React Hook
 * Form, which also supplies `isSubmitting` and removes the hand-rolled
 * `isPending` flag.
 */
export function useManageCategories({
	type,
	workspaceId,
	projectId,
}: UseManageCategoriesParams) {
	const {
		categories,
		isLoading,
		updateCategory,
		deleteCategory,
		updateProjectCategory,
		deleteProjectCategory,
		refreshCategoryStyles,
	} = useCategoryStore();

	const [editingRowId, setEditingRowId] = useState<string | null>(null);
	const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
		null,
	);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<EditCategoryFormValues>({
		resolver: zodResolver(EditCategorySchema),
		defaultValues: { name: "", color: "#94a3b8" },
	});

	/** category scope - determines if the modal edits project or workspace categories, matching the exact cache key used for badge colors. */
	const categoryScope: CategoryScope = projectId
		? { kind: "project", id: projectId, type }
		: { kind: "workspace", id: workspaceId, type };

	const startEditing = (category: Category) => {
		setEditingRowId(category.id ?? "");
		reset({ name: category.name, color: category.color });
	};

	const cancelEditing = () => {
		setEditingRowId(null);
		reset();
	};

	const saveEditing = (oldName: string) =>
		handleSubmit(async ({ name, color }) => {
			const success = projectId
				? await updateProjectCategory(projectId, oldName, name, color, type)
				: await updateCategory(workspaceId, oldName, name, color, type);

			if (!success) return;

			setEditingRowId(null);
			/** cache invalidation - forces a refresh of category styles after an edit so badges don't keep painting the old color. */
			await refreshCategoryStyles(categoryScope);
		});

	const confirmDelete = async () => {
		if (!categoryToDelete) return;

		const success = projectId
			? await deleteProjectCategory(projectId, categoryToDelete.name, type)
			: await deleteCategory(workspaceId, categoryToDelete.name, type);

		if (!success) return;

		setCategoryToDelete(null);
		await refreshCategoryStyles(categoryScope);
	};

	return {
		categories,
		isLoading,
		isSubmitting,
		errors,
		register,
		editingRowId,
		startEditing,
		cancelEditing,
		saveEditing,
		categoryToDelete,
		setCategoryToDelete,
		confirmDelete,
	};
}
