"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
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

interface DeleteProjectModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectName: string;
	onConfirmDelete: () => void;
}

export function DeleteProjectModal({
	open,
	onOpenChange,
	projectName,
	onConfirmDelete,
}: DeleteProjectModalProps) {
	const [confirmationText, setConfirmationText] = useState("");

	const isConfirmed = confirmationText === projectName;

	const handleConfirm = () => {
		if (isConfirmed) {
			onConfirmDelete();
			onOpenChange(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setConfirmationText("");
		}
		onOpenChange(newOpen);
	};

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
						This action cannot be undone. This will permanently delete the{" "}
						<span className="font-semibold">{projectName}</span> project, tasks,
						comments, and remove all member associations.
					</DialogDescription>
				</DialogHeader>

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
						variant="outline"
						onClick={() => handleOpenChange(false)}
						className="border-outline-variant text-secondary"
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={!isConfirmed}
						onClick={handleConfirm}
						className="bg-error text-error-foreground hover:bg-error/90 disabled:opacity-50"
					>
						Delete Project
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
