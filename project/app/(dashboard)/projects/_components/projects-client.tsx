"use client";

import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import projectFilters from "@/app/(dashboard)/_constants/filters";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/buttons/button";
import { FilterChip } from "@/components/ui/filters/filter-chip";
import { TagFilter } from "@/components/ui/filters/tag-filter";
import { CreateProjectModal } from "../_components/ui/modals/create-project-modal";
import { useProjectsClient } from "../_hooks/use-projects-client";
import { ProjectCard } from "./ui/cards/project-card";

export function ProjectsClient() {
	const { modals, selection, filters } = useProjectsClient();

	const isSingleDelete = selection.projectToDelete !== null;
	const deleteCount = isSingleDelete ? 1 : selection.selectedProjectIds.size;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
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
					<>
						<FilterChip
							label="Owned Projects"
							isActive={filters.ownedActive}
							onClick={() => filters.setOwnedActive(!filters.ownedActive)}
						/>
						<FilterChip
							label="Assigned to Me"
							isActive={filters.assignedActive}
							onClick={() => filters.setAssignedActive(!filters.assignedActive)}
						/>
						<div className="flex-1 min-w-5" />
						<TagFilter
							filterDefinitions={projectFilters}
							activeFilters={filters.activeTags}
							onAddFilter={filters.handleAddTag}
							onRemoveFilter={filters.handleRemoveTag}
							onReset={filters.handleResetTags}
						/>
						{/* Selection Toggle Button */}
						<Button
							variant={selection.isSelectMode ? "default" : "outline"}
							size="sm"
							onClick={selection.toggleSelectMode}
							className="gap-2"
						>
							<CheckSquare className="w-4 h-4" />
							{selection.isSelectMode ? "Cancel Selection" : "Select"}
						</Button>

						{/* Conditional Bulk Delete Button */}
						{selection.isSelectMode &&
							selection.selectedProjectIds.size > 0 && (
								<Button
									variant="destructive"
									size="sm"
									className="gap-2"
									onClick={selection.initiateBulkDelete}
								>
									<Trash2 className="w-4 h-4" />
									Delete ({selection.selectedProjectIds.size})
								</Button>
							)}
					</>
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
			<CreateProjectModal
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
		</div>
	);
}
