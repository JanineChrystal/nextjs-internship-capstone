"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";
import type {
	CreateProjectFormValues,
	Project,
} from "@/lib/validations/project-schema";
import { projectFormFields } from "../../../_constants/create-project";
import { useCreateProject } from "../../../_hooks/use-create-project";
import { useEditProject } from "../../../_hooks/use-edit-project";

interface CreateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialData?: Project;
}

export function CreateProjectModal({
	isOpen,
	onClose,
	initialData,
}: CreateProjectModalProps) {
	// Hooks rule: Both must be called unconditionally. We just use the one we need.
	const createProps = useCreateProject({ onClose });
	// Fallback empty initial data for edit hook if not provided (safe to do since we only call its onSubmit if we are in edit mode)
	const editProps = useEditProject(
		initialData?.id || "",
		initialData || {
			title: "",
			status: "active",
			category: "",
			startDate: "",
			dueDate: "",
			description: "",
			priority: "low",
		},
	);

	const isEditMode = !!initialData;
	// Use the appropriate form instance
	const form = (isEditMode
		? editProps.form
		: createProps.form) as unknown as ReturnType<
		typeof useCreateProject
	>["form"];

	const handleSubmit = form.handleSubmit((_data) => {
		if (isEditMode) {
			// Trigger edit save
			editProps.onSubmit(undefined);
			onClose();
		} else {
			// Trigger create save
			createProps.onSubmit(undefined);
		}
	});

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditMode ? "Edit Project" : "Create New Project"}
			maxWidth="4xl"
		>
			<form onSubmit={handleSubmit} className="p-6 space-y-8">
				{/* Project Title */}
				<div className="space-y-2">
					<input
						type="text"
						id="title"
						{...form.register("title")}
						placeholder="Enter project name..."
						className="w-full bg-transparent border-none text-h2 font-h2 text-foreground placeholder:text-muted-foreground focus:ring-0 p-0 shadow-none outline-none"
					/>
					{form.formState.errors.title && (
						<p className="text-sm text-destructive">
							{form.formState.errors.title.message as string}
						</p>
					)}
				</div>

				{/* Form Grid mapped dynamically */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{projectFormFields.map((field) => (
						<div key={field.id} className="space-y-2">
							<label
								htmlFor={field.id}
								className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
							>
								{field.label}
							</label>

							{field.type === "select" ? (
								<select
									id={field.id}
									{...form.register(field.id as keyof CreateProjectFormValues)}
									className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
								>
									{field.options?.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							) : (
								<input
									id={field.id}
									type={field.type}
									{...form.register(field.id as keyof CreateProjectFormValues)}
									placeholder={field.placeholder}
									className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
								/>
							)}
							{form.formState.errors[
								field.id as keyof CreateProjectFormValues
							] && (
								<p className="text-sm text-destructive">
									{
										form.formState.errors[
											field.id as keyof CreateProjectFormValues
										]?.message as string
									}
								</p>
							)}
						</div>
					))}
				</div>

				{/* Team Members : To be modified once the team page is done */}
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

				{/* Description */}
				<div className="space-y-2">
					<label
						htmlFor="description"
						className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider"
					>
						Project Description
					</label>
					<textarea
						id="description"
						{...form.register("description")}
						rows={4}
						placeholder="Briefly describe the project goals and deliverables..."
						className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
					/>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
					<div>
						{isEditMode && initialData && (
							<Button variant="outline" asChild>
								<Link href={`/projects/${initialData.id}`}>
									View Full Project Page
								</Link>
							</Button>
						)}
					</div>
					<div className="flex items-center gap-3">
						<Button
							type="button"
							onClick={onClose}
							variant="outline"
							className="px-4 py-2 text-sm font-medium transition-colors"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
						>
							{isEditMode ? "Save Changes" : "Create Project"}
						</Button>
					</div>
				</div>
			</form>
		</BaseModal>
	);
}
