"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useManageCategories } from "@/hooks/use-manage-categories";
import type { Category, CategoryType } from "@/lib/types/category";

interface ManageCategoriesModalProps {
	isOpen: boolean;
	onClose: () => void;
	type: CategoryType;
	workspaceId: string;
	/** workspace ownership - defines whether the category belongs to the project workspace instead of the user's personal workspace, ensuring correct permissions. */
	projectId?: string;
}

export function ManageCategoriesModal({
	isOpen,
	onClose,
	type,
	workspaceId,
	projectId,
}: ManageCategoriesModalProps) {
	const {
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
	} = useManageCategories({ type, workspaceId, projectId });

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
									{editingRowId === category.id ? (
										<form
											onSubmit={saveEditing(category.name)}
											className="flex flex-col gap-1 flex-1"
										>
											<div className="flex items-center gap-2">
												<Input
													type="color"
													{...register("color")}
													className="w-8 h-8 p-0 border-none rounded cursor-pointer"
												/>
												<Input
													{...register("name")}
													className="flex-1 h-8"
													aria-invalid={Boolean(errors.name)}
													autoFocus
												/>
												<Button
													type="submit"
													size="icon-xs"
													variant="ghost"
													disabled={isSubmitting}
												>
													{isSubmitting ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Check className="h-4 w-4 text-green-500" />
													)}
												</Button>
												<Button
													type="button"
													size="icon-xs"
													variant="ghost"
													onClick={cancelEditing}
													disabled={isSubmitting}
												>
													<X className="h-4 w-4 text-muted-foreground" />
												</Button>
											</div>
											{errors.name && (
												<p className="text-xs text-destructive">
													{errors.name.message}
												</p>
											)}
										</form>
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
													type="button"
													size="icon-xs"
													variant="ghost"
													onClick={() => startEditing(category)}
												>
													<Pencil className="h-4 w-4 text-muted-foreground" />
												</Button>
												<Button
													type="button"
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
				confirmText="Delete"
				cancelText="Cancel"
				isDestructive
			/>
		</>
	);
}
