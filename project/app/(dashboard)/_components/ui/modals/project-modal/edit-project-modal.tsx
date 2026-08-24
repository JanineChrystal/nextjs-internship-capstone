import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import { CreatableCombobox } from "@/components/ui/combobox/creatable-combobox";
import { ManageCategoriesModal } from "@/components/ui/modals/manage-categories-modal";
import type {
	CreateProjectFormValues,
	Project,
} from "@/lib/validations/project-schema";
import { useCategoryStore } from "@/stores/use-category-store";
import { projectFormFields } from "../../../../projects/_constants/create-project";
import { useEditProject } from "../../../../projects/_hooks/use-edit-project";
import { ProjectTeamSection } from "./project-team-section";

export function EditProjectModal({
	onClose,
	initialData,
}: {
	onClose: () => void;
	initialData: Project;
}) {
	const { form, onSubmit } = useEditProject(initialData.id, initialData);
	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

	const { categories, fetchCategories } = useCategoryStore();

	useEffect(() => {
		fetchCategories("default", "project");
	}, [fetchCategories]);

	const handleSubmit = form.handleSubmit((_data) => {
		onSubmit(undefined);
		onClose();
	});

	return (
		<form onSubmit={handleSubmit} className="p-6 space-y-8">
			{/* project title input */}
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

			{/* dynamic form grid */}
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
						) : field.type === "creatable-combobox" ? (
							<CreatableCombobox
								options={categories.map((c) => ({
									value: c.name,
									label: c.name,
									color: c.color,
								}))}
								value={
									form.watch(
										field.id as keyof CreateProjectFormValues,
									) as string
								}
								onChange={(val) =>
									form.setValue(
										field.id as keyof CreateProjectFormValues,
										val,
										{
											shouldValidate: true,
											shouldDirty: true,
										},
									)
								}
								placeholder={field.placeholder}
								onManageClick={() => setIsManageCategoriesOpen(true)}
							/>
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

			{/* team members section */}
			<ProjectTeamSection projectId={initialData.id} />

			{/* project description text area */}
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

			{/* modal footer controls */}
			<div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
				<div>
					<Button variant="outline" asChild>
						<Link href={`/projects/${initialData.id}`}>
							View Full Project Page
						</Link>
					</Button>
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
						Save Changes
					</Button>
				</div>
			</div>

			<ManageCategoriesModal
				isOpen={isManageCategoriesOpen}
				onClose={() => setIsManageCategoriesOpen(false)}
				type="project"
				workspaceId="default"
			/>
		</form>
	);
}
