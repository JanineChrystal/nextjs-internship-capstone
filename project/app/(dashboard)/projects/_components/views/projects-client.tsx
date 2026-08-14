"use client";

import { CheckSquare, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { Toolbar } from "@/app/(dashboard)/_components/ui/toolbar/toolbar";
import { TASK_PRIORITY_OPTIONS } from "@/app/(dashboard)/_constants/task";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/buttons/button";
import { FilterPopover } from "@/components/ui/filters/filter-popover";
import type { Project } from "@/lib/validations/project-schema";
import { useProjectsClient } from "../../_hooks/use-projects-client";
import { ProjectCard } from "../ui/cards/project-card";

const ProjectModal = dynamic(
	() =>
		import("../../../_components/ui/modals/project-modal").then(
			(m) => m.ProjectModal,
		),
	{ ssr: false },
);

// 1. Define the props interface to satisfy TypeScript
// Replace `any` with your actual Project type (e.g., `Project[]`) if you have it exported
export interface ProjectsClientProps {
	initialProjects: Project[];
}

// 2. Accept the prop in the component signature
export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
	// 3. (Optional but recommended) Pass the initial data into your custom hook
	// so it can use the server-fetched data as its starting state.
	const { modals, selection, filters } = useProjectsClient(initialProjects);

	const isSingleDelete = selection.projectToDelete !== null;
	const deleteCount = isSingleDelete ? 1 : selection.selectedProjectIds.size;

	const categories = useMemo(() => {
		const uniqueCategories = new Set(
			initialProjects.map((p) => p.category?.trim() || "Uncategorized"),
		);
		return Array.from(uniqueCategories).map((c) => ({
			label: c,
			value: c.toLowerCase(),
		}));
	}, [initialProjects]);

	const filterFields = [
		{
			id: "status",
			label: "Status",
			options: [
				{ label: "Active", value: "active" },
				{ label: "Completed", value: "completed" },
				{ label: "Overdue", value: "overdue" },
				{ label: "Archived", value: "archived" },
			],
		},
		{
			id: "priority",
			label: "Priority",
			options: TASK_PRIORITY_OPTIONS,
		},
		{
			id: "category",
			label: "Category",
			options: categories,
		},
		{
			id: "isOwned",
			label: "Ownership",
			options: [{ label: "Owned by Me", value: "true" }],
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
				className="bg-surface border border-outline-variant rounded-xl p-6"
				action={
					<Button
						className="w-full sm:w-auto"
						onClick={() => modals.create.setIsOpen(true)}
					>
						<Plus className="w-4 h-4 mr-2" />
						Create New Project
					</Button>
				}
				filters={
					<Toolbar
						rightSection={
							<>
								<FilterPopover
									fields={filterFields}
									values={filters.filterValues}
									onChange={filters.handleFilterChange}
									onReset={filters.handleResetFilters}
								/>
								<Button
									variant={selection.isSelectMode ? "default" : "outline"}
									size="sm"
									onClick={selection.toggleSelectMode}
									className="gap-2"
								>
									<CheckSquare className="w-4 h-4" />
									{selection.isSelectMode ? "Cancel Selection" : "Select"}
								</Button>
							</>
						}
					/>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filters.filteredProjects.length > 0 ? (
					filters.filteredProjects.map((project) => (
						<div key={project.id} className="relative">
							{/* Selection Overlay for Cards */}
							{selection.isSelectMode && (
								<button
									type="button"
									aria-label={`Select ${project.title}`}
									className="absolute inset-0 z-10 cursor-pointer rounded-xl border-2 transition-all w-full text-left"
									style={{
										borderColor: selection.selectedProjectIds.has(project.id)
											? "var(--primary)"
											: "transparent",
										backgroundColor: selection.selectedProjectIds.has(
											project.id,
										)
											? "rgba(var(--primary-rgb), 0.05)"
											: "transparent",
									}}
									onClick={(e) => {
										e.preventDefault();
										selection.toggleSelection(project.id);
									}}
								>
									<div
										className={`absolute top-4 right-4 w-5 h-5 rounded border ${selection.selectedProjectIds.has(project.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"}`}
									>
										{selection.selectedProjectIds.has(project.id) && (
											<CheckSquare className="w-full h-full p-0.5" />
										)}
									</div>
								</button>
							)}

							<ProjectCard
								project={project}
								isSelectMode={selection.isSelectMode}
								onDelete={selection.initiateSingleDelete}
							/>
						</div>
					))
				) : (
					<div className="col-span-full py-12 text-center text-muted-foreground">
						No projects found matching the selected filters.
					</div>
				)}
			</div>

			{/* Render Modals */}
			<ProjectModal
				isOpen={modals.create.isOpen}
				onClose={() => modals.create.setIsOpen(false)}
			/>

			<ActionConfirmModal
				isOpen={modals.delete.isOpen}
				onClose={modals.delete.close}
				onConfirm={selection.confirmDelete}
				title={isSingleDelete ? "Delete Project" : "Delete Projects"}
				description={`Are you sure you want to delete ${deleteCount} selected project(s)? This action cannot be undone.`}
				confirmText={isSingleDelete ? "Delete Project" : "Delete Projects"}
				isDestructive={true}
			/>

			<BulkActionBar
				selectedCount={selection.selectedProjectIds.size}
				onClearSelection={selection.toggleSelectMode}
				onDelete={selection.initiateBulkDelete}
				onArchive={selection.initiateBulkArchive}
			/>
		</div>
	);
}
