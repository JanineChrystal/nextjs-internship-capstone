"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { useDeleteProjectModal } from "../../../_hooks/use-delete-project-modal";

interface DeleteProjectModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectName: string;
	onConfirmDelete: () => void;
	/**
	 * open task warning - displays an inline warning about unfinished tasks within
	 * the confirmation dialog to avoid redundant modal stacking during deletion.
	 */
	openTaskWarning?: boolean;
	/** disable state - prevents multiple submissions while deletion is processing. */
	isDeleting?: boolean;
}

export function DeleteProjectModal({
	open,
	onOpenChange,
	projectName,
	onConfirmDelete,
	openTaskWarning = false,
	isDeleting = false,
}: DeleteProjectModalProps) {
	const {
		confirmationText,
		setConfirmationText,
		isConfirmed,
		handleConfirm,
		handleOpenChange,
	} = useDeleteProjectModal(projectName, onOpenChange, onConfirmDelete);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md bg-surface border-error/20">
				<DialogHeader>
					<div className="flex items-center gap-2 text-error mb-2">
						<AlertTriangle size={24} />
						<DialogTitle className="text-xl font-bold">
							Delete Project
						</DialogTitle>
					</div>
					<DialogDescription className="text-on-surface">
						This moves the <span className="font-semibold">{projectName}</span>{" "}
						project to the trash, along with its tasks, comments and member
						associations. You can restore it from the archive for{" "}
						{TRASH_RETENTION_DAYS} days, after which it is deleted permanently.
					</DialogDescription>
				</DialogHeader>

				{openTaskWarning && (
					<p className="rounded-lg border border-warning/40 bg-warning-container px-3 py-2 text-sm text-on-warning-container">
						This project still has unfinished tasks. They go to the trash with
						it.
					</p>
				)}

				<div className="flex flex-col gap-3 py-4">
					<label
						htmlFor="confirmation"
						className="text-sm font-medium text-secondary"
					>
						Please type{" "}
						<span className="font-bold text-on-surface">{projectName}</span> to
						confirm.
					</label>
					<Input
						id="confirmation"
						value={confirmationText}
						onChange={(e) => setConfirmationText(e.target.value)}
						placeholder={projectName}
						className="bg-surface-container-lowest border-outline-variant text-on-surface focus-visible:ring-error"
					/>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isDeleting}
						className="border-outline-variant text-secondary"
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={!isConfirmed || isDeleting}
						onClick={handleConfirm}
						// high contrast labeling - uses solid fill specific colors for better readability instead of relying on standard error foregrounds.
						className="bg-danger-solid text-on-danger-solid hover:bg-danger-solid/90 disabled:opacity-50"
					>
						{isDeleting ? "Deleting…" : "Delete Project"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
