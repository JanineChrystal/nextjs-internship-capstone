"use client";

import { Calendar, Edit2 } from "lucide-react";
import { useEffect } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/buttons/button";
import type { EditProjectFormValues } from "@/lib/validations/project-schema";
import { projectStatusOptions } from "../../_constants/create-project";
import { useEditProject } from "../../_hooks/use-edit-project";

interface ProjectHeaderProps {
	projectId: string;
	project: EditProjectFormValues;
}

export function ProjectHeader({ projectId, project }: ProjectHeaderProps) {
	const { isEditing, setIsEditing, form, onSubmit, onCancel } = useEditProject(
		projectId,
		project,
	);

	useEffect(() => {
		if (isEditing) form.setFocus("title");
	}, [isEditing, form]);

	// --- 1. Shadcn Breadcrumbs ---
	const projectBreadcrumbs = (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{project.title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);

	// --- 2. Action Button ---
	const actionButton = !isEditing && (
		<Button
			type="button"
			variant="ghost"
			onClick={() => setIsEditing(true)}
			className="flex items-center gap-2 text-secondary hover:bg-surface-variant font-label-md"
		>
			<Edit2 size={16} />
			Edit
		</Button>
	);

	// --- 3. View Mode Rendering ---
	if (!isEditing) {
		return (
			<PageHeader
				breadcrumbs={projectBreadcrumbs}
				title={project.title}
				description={project.description || "No description provided."}
				action={actionButton}
				className="border-b border-outline-variant pb-stack-md mb-stack-lg"
			>
				<div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-label-sm font-medium capitalize">
					<span
						className={`w-2 h-2 rounded-full ${project.status === "active" ? "bg-green-500" : "bg-secondary"}`}
					/>
					{project.status}
				</div>
				<div className="flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-medium">
					{project.category}
				</div>
				<div className="flex items-center gap-2 text-secondary text-label-sm">
					<Calendar size={14} />
					{project.startDate}
				</div>
				<span className="text-outline-variant">•</span>
				<div className="flex items-center gap-2 text-secondary text-label-sm">
					<Calendar size={14} />
					{project.dueDate}
				</div>
			</PageHeader>
		);
	}

	// --- 4. Edit Mode Rendering ---
	return (
		<form onSubmit={onSubmit} className="w-full">
			<PageHeader
				breadcrumbs={projectBreadcrumbs}
				className="border-b border-outline-variant pb-stack-md mb-stack-lg"
				title={
					<input
						id="title"
						{...form.register("title")}
						className="w-full bg-transparent border-b border-primary focus:outline-none pb-1 font-bold text-h1"
					/>
				}
				description={
					<textarea
						id="description"
						{...form.register("description")}
						className="w-full bg-transparent border border-outline-variant rounded-md p-3 focus:outline-none focus:border-primary resize-y text-body-md mt-2"
						rows={2}
					/>
				}
				action={
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</div>
				}
			>
				{/* Biome a11y Fix: Added htmlFor and id to all inputs */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
					<div className="flex flex-col gap-1">
						<label
							htmlFor="status"
							className="text-[10px] font-bold uppercase tracking-wider text-secondary"
						>
							Status
						</label>
						<select
							id="status"
							{...form.register("status")}
							className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 font-label-md"
						>
							{projectStatusOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1">
						<label
							htmlFor="category"
							className="text-[10px] font-bold uppercase tracking-wider text-secondary"
						>
							Category
						</label>
						<input
							id="category"
							{...form.register("category")}
							className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 font-label-md"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label
							htmlFor="startDate"
							className="text-[10px] font-bold uppercase tracking-wider text-secondary"
						>
							Start Date
						</label>
						<input
							id="startDate"
							type="date"
							{...form.register("startDate")}
							className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 font-label-md"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label
							htmlFor="dueDate"
							className="text-[10px] font-bold uppercase tracking-wider text-secondary"
						>
							Due Date
						</label>
						<input
							id="dueDate"
							type="date"
							{...form.register("dueDate")}
							className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 font-label-md"
						/>
					</div>
				</div>
			</PageHeader>
		</form>
	);
}
