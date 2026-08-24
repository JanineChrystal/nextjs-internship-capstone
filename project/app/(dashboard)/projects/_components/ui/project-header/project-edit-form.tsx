"use client";

import { Calendar, Check, Flag, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { TASK_PRIORITY_BADGE_STYLES } from "@/app/(dashboard)/_constants/task";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/buttons/button";
import { CreatableCombobox } from "@/components/ui/combobox/creatable-combobox";
import { ManageCategoriesModal } from "@/components/ui/modals/manage-categories-modal";
import type { EditProjectFormValues } from "@/lib/validations/project-schema";
import { useCategoryStore } from "@/stores/use-category-store";
import { projectStatusOptions } from "../../../_constants/create-project";
import { projectPriorityOptions } from "../../../_constants/kanban";

interface ProjectEditFormProps {
	project: EditProjectFormValues & { priority?: string };
	form: UseFormReturn<EditProjectFormValues>;
	onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
	onCancel: () => void;
}

export function ProjectEditForm({
	project,
	form,
	onSubmit,
	onCancel,
}: ProjectEditFormProps) {
	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

	const { categories, fetchCategories } = useCategoryStore();

	useEffect(() => {
		fetchCategories("default", "project");
	}, [fetchCategories]);

	// real-time form bindings - watches specific fields to update UI element colors instantly during editing.
	const currentPriority = form.watch("priority");
	const currentStatus = form.watch("status");

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

	const actions = (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onCancel}
				className="gap-2 h-9"
			>
				<X size={16} />
				Cancel
			</Button>
			<Button type="submit" size="sm" className="gap-2 h-9">
				<Check size={16} />
				Save
			</Button>
		</div>
	);

	const titleElement = (
		<input
			id="title"
			{...form.register("title")}
			className="w-full bg-transparent focus:outline-none border-b border-primary border-dashed pb-1 font-bold text-5xl tracking-tight text-on-surface"
			placeholder="Project Title"
		/>
	);

	const descriptionElement = (
		<textarea
			id="description"
			{...form.register("description")}
			className="w-full max-w-3xl bg-transparent focus:outline-none border-b border-primary border-dashed resize-none text-sm text-card-foreground/70"
			rows={2}
			placeholder="Project Description"
		/>
	);

	return (
		<form onSubmit={onSubmit} className="w-full">
			<PageHeader
				breadcrumbs={projectBreadcrumbs}
				title={titleElement}
				description={descriptionElement}
				className="transition-all ring-1 ring-primary/30"
			>
				{/* status selector - provides an inline dropdown for changing project status. */}
				<div className="relative flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-label-sm font-medium capitalize transition-all focus-within:ring-2 focus-within:ring-primary">
					<span
						className={`w-2 h-2 rounded-full shrink-0 ${
							currentStatus === "active" ? "bg-green-500" : "bg-secondary"
						}`}
					/>
					<select
						{...form.register("status")}
						className="appearance-none bg-transparent outline-none cursor-pointer pr-4 py-0 w-full min-w-20"
					>
						<option value="">No Status</option>
						{projectStatusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				{/* priority selector - provides an inline dropdown for changing project priority with dynamic styling. */}
				<div
					className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium capitalize border transition-all ${
						TASK_PRIORITY_BADGE_STYLES[currentPriority?.toLowerCase() || "low"]
					} focus-within:ring-2 focus-within:ring-primary`}
				>
					<Flag size={12} className="shrink-0" />
					<select
						{...form.register("priority")}
						className="appearance-none bg-transparent outline-none cursor-pointer pr-4 py-0 w-full min-w-25"
					>
						<option value="">No Priority</option>
						{projectPriorityOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label} Priority
							</option>
						))}
					</select>
				</div>

				{/* category combobox - allows selecting existing categories or creating new ones directly. */}
				<div className="relative flex items-center gap-2 rounded-full text-label-sm font-medium transition-all min-w-37.5">
					<CreatableCombobox
						options={categories.map((c) => ({
							value: c.name,
							label: c.name,
							color: c.color,
						}))}
						value={form.watch("category") as string}
						onChange={(val) =>
							form.setValue("category", val, {
								shouldValidate: true,
								shouldDirty: true,
							})
						}
						placeholder="Category..."
						onManageClick={() => setIsManageCategoriesOpen(true)}
					/>
				</div>

				{/* start date input - captures the project start date via a native datetime picker. */}
				<div className="relative flex items-center gap-2 text-secondary text-label-sm px-2 py-1 rounded-md transition-all bg-surface-container-high focus-within:ring-2 focus-within:ring-primary">
					<Calendar size={14} className="shrink-0" />
					<input
						type="datetime-local"
						{...form.register("startDate")}
						className="appearance-none bg-transparent outline-none py-0 w-full text-secondary"
					/>
				</div>

				<span className="text-outline-variant hidden sm:inline">•</span>

				{/* due date input - captures the project due date via a native datetime picker. */}
				<div className="relative flex items-center gap-2 text-secondary text-label-sm px-2 py-1 rounded-md transition-all bg-surface-container-high focus-within:ring-2 focus-within:ring-primary">
					<Calendar size={14} className="shrink-0" />
					<input
						type="datetime-local"
						{...form.register("dueDate")}
						className="appearance-none bg-transparent outline-none py-0 w-full text-secondary"
					/>
				</div>

				<div className="ml-auto">{actions}</div>
			</PageHeader>

			<ManageCategoriesModal
				isOpen={isManageCategoriesOpen}
				onClose={() => setIsManageCategoriesOpen(false)}
				type="project"
				workspaceId="default"
			/>
		</form>
	);
}
