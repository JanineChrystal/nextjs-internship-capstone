"use client";

import { Plus } from "lucide-react";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";

interface CreateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateProjectModal({
	isOpen,
	onClose,
}: CreateProjectModalProps) {
	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title="Create New Project"
			maxWidth="4xl"
		>
			<div className="p-6 space-y-8">
				{/* Project Title */}
				<div className="space-y-2">
					<input
						type="text"
						placeholder="Enter project name..."
						className="w-full bg-transparent border-none text-h2 font-h2 text-foreground placeholder:text-muted-foreground focus:ring-0 p-0 shadow-none outline-none"
					/>
				</div>

				{/* Form Grid */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{/* Status */}
					<div className="space-y-2">
						<label
							htmlFor="status"
							className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
						>
							Status
						</label>
						<select
							id="status"
							className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						>
							<option>Active</option>
							<option>Planning</option>
							<option>Completed</option>
						</select>
					</div>

					{/* Category */}
					<div className="space-y-2">
						<label
							htmlFor="category"
							className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
						>
							Category
						</label>
						<input
							id="category"
							type="text"
							placeholder="e.g., Development"
							className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>

					{/* Start Date */}
					<div className="space-y-2">
						<label
							htmlFor="startDate"
							className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
						>
							Start Date
						</label>
						<input
							id="startDate"
							type="date"
							className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>

					{/* Due Date */}
					<div className="space-y-2">
						<label
							htmlFor="dueDate"
							className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
						>
							Due Date
						</label>
						<input
							id="dueDate"
							type="date"
							className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
						/>
					</div>
				</div>

				{/* Team Members */}
				<div className="space-y-2">
					<span className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider">
						Team Members
					</span>
					<div className="flex items-center gap-3 flex-wrap">
						<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border border-border">
							JD
						</div>
						<button
							type="button"
							aria-label="Add team member"
							className="w-10 h-10 rounded-full border border-dashed border-input flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
						>
							<Plus className="w-5 h-5" />
						</button>
					</div>
				</div>

				<div className="space-y-2">
					<label
						htmlFor="description"
						className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
					>
						Project Description
					</label>
					<textarea
						id="description"
						rows={4}
						placeholder="Briefly describe the project goals and deliverables..."
						className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
					/>
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 mt-4">
				<Button
					type="button"
					onClick={onClose}
					className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
				>
					Cancel
				</Button>
				<Button
					type="submit"
					className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
				>
					Create Project
				</Button>
			</div>
		</BaseModal>
	);
}
