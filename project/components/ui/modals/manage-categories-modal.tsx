"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Category, useCategoryStore } from "@/stores/use-category-store";

interface ManageCategoriesModalProps {
	isOpen: boolean;
	onClose: () => void;
	type: "project" | "task";
	workspaceId: string;
}

export function ManageCategoriesModal({
	isOpen,
	onClose,
	type,
	workspaceId,
}: ManageCategoriesModalProps) {
	const { categories, isLoading, updateCategory, deleteCategory } =
		useCategoryStore();
	const [editingCategory, setEditingCategory] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState("");
	const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
		null,
	);
	const [isPending, setIsPending] = useState(false);

	const startEditing = (category: Category) => {
		setEditingCategory(category.id || "");
		setEditName(category.name);
		setEditColor(category.color);
	};

	const saveEditing = async (oldName: string) => {
		if (!editName.trim()) return;
		setIsPending(true);
		const success = await updateCategory(
			workspaceId,
			oldName,
			editName.trim(),
			editColor,
			type,
		);
		if (success) {
			setEditingCategory(null);
		}
		setIsPending(false);
	};

	const confirmDelete = async () => {
		if (categoryToDelete) {
			setIsPending(true);
			const success = await deleteCategory(
				workspaceId,
				categoryToDelete.name,
				type,
			);
			if (success) {
				setCategoryToDelete(null);
			}
			setIsPending(false);
		}
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Manage Categories</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
						{isLoading ? (
							<div className="flex justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : categories?.length === 0 ? (
							<p className="text-center text-sm text-muted-foreground py-8">
								No categories found.
							</p>
						) : (
							categories?.map((category: Category) => (
								<div
									key={category.id}
									className="flex items-center justify-between p-3 rounded-md border bg-card"
								>
									{editingCategory === category.id ? (
										<div className="flex items-center gap-2 flex-1">
											<Input
												type="color"
												value={editColor}
												onChange={(e) => setEditColor(e.target.value)}
												className="w-8 h-8 p-0 border-none rounded cursor-pointer"
											/>
											<Input
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												className="flex-1 h-8"
												autoFocus
											/>
											<Button
												size="icon-xs"
												variant="ghost"
												onClick={() => saveEditing(category.name)}
												disabled={isPending}
											>
												{isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Check className="h-4 w-4 text-green-500" />
												)}
											</Button>
											<Button
												size="icon-xs"
												variant="ghost"
												onClick={() => setEditingCategory(null)}
												disabled={isPending}
											>
												<X className="h-4 w-4 text-muted-foreground" />
											</Button>
										</div>
									) : (
										<>
											<div className="flex items-center gap-3">
												<div
													className="w-4 h-4 rounded-full border border-border/50"
													style={{ backgroundColor: category.color }}
												/>
												<span className="text-sm font-medium">
													{category.name}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Button
													size="icon-xs"
													variant="ghost"
													onClick={() => startEditing(category)}
												>
													<Pencil className="h-4 w-4 text-muted-foreground" />
												</Button>
												<Button
													size="icon-xs"
													variant="ghost"
													onClick={() => setCategoryToDelete(category)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										</>
									)}
								</div>
							))
						)}
					</div>
				</DialogContent>
			</Dialog>

			<ActionConfirmModal
				isOpen={!!categoryToDelete}
				onClose={() => setCategoryToDelete(null)}
				onConfirm={confirmDelete}
				title="Delete Category"
				description="Are you sure you want to delete this category? All associated items will be safely marked as 'Uncategorized'."
				confirmText={isPending ? "Deleting..." : "Delete"}
				cancelText="Cancel"
				isDestructive
			/>
		</>
	);
}
