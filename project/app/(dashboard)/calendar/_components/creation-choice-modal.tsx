"use client";

import { CheckSquare, FolderKanban } from "lucide-react";
import { useState } from "react";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";

interface CreationChoiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProceed: (choice: "project" | "task") => void;
}

export function CreationChoiceModal({
	isOpen,
	onClose,
	onProceed,
}: CreationChoiceModalProps) {
	const [selected, setSelected] = useState<"project" | "task" | null>(null);

	const handleProceed = () => {
		if (selected) {
			onProceed(selected);
			// Reset for next time
			setTimeout(() => setSelected(null), 300);
		}
	};

	const handleClose = () => {
		onClose();
		setTimeout(() => setSelected(null), 300);
	};

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleClose}
			title="What would you like to create?"
			maxWidth="md"
		>
			<div className="p-6 space-y-6">
				<div className="grid grid-cols-2 gap-4">
					{/* Project Option */}
					<button
						type="button"
						onClick={() => setSelected("project")}
						className={cn(
							"flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
							selected === "project"
								? "border-primary bg-primary/5 text-primary"
								: "border-outline-variant bg-surface hover:bg-surface-variant hover:border-outline text-foreground",
						)}
					>
						<FolderKanban
							className={cn(
								"w-8 h-8",
								selected === "project" ? "text-primary" : "text-secondary",
							)}
						/>
						<span className="font-semibold">Project</span>
					</button>

					{/* Task Option */}
					<button
						type="button"
						onClick={() => setSelected("task")}
						className={cn(
							"flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
							selected === "task"
								? "border-primary bg-primary/5 text-primary"
								: "border-outline-variant bg-surface hover:bg-surface-variant hover:border-outline text-foreground",
						)}
					>
						<CheckSquare
							className={cn(
								"w-8 h-8",
								selected === "task" ? "text-primary" : "text-secondary",
							)}
						/>
						<span className="font-semibold">Task</span>
					</button>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleProceed} disabled={!selected}>
						Proceed
					</Button>
				</div>
			</div>
		</BaseModal>
	);
}
