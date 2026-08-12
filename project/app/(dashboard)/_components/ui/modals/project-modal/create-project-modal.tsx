import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import type { CreateProjectFormValues } from "@/lib/validations/project-schema";
import { projectFormFields } from "../../../../projects/_constants/create-project";
import { mockProjectMembers } from "../../../../projects/_constants/mock-data";
import { useCreateProject } from "../../../../projects/_hooks/use-create-project";

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
	const { form, onSubmit } = useCreateProject({ onClose });

	const handleSubmit = form.handleSubmit((_data) => {
		onSubmit(undefined);
	});

	return (
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

			{/* Team Members */}
			<div className="space-y-2">
				<span className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider">
					Team Members
				</span>
				<div className="flex items-center gap-3 flex-wrap">
					{mockProjectMembers.map((member) => (
						<div
							key={member.id}
							className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border border-border"
							title={member.name}
						>
							{member.initials}
						</div>
					))}
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
				<div />
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
						Create Project
					</Button>
				</div>
			</div>
		</form>
	);
}
