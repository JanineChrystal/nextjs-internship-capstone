"use client";

import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import projectFilters from "@/app/(dashboard)/_constants/filters";
import { useProjectFilters } from "@/app/(dashboard)/hooks/use-project-filters";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/buttons/button";
import { FilterChip } from "@/components/ui/filters/filter-chip";
import { TagFilter } from "@/components/ui/filters/tag-filter";
import type { Project } from "@/lib/validations/project-schema";
import { CreateProjectModal } from "../_components/ui/modals/create-project-modal";
import { ProjectCard } from "./ui/cards/project-card";

interface ProjectsClientProps {
	initialProjects: Project[];
}

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
		new Set(),
	);

	const {
		filteredProjects,
		ownedActive,
		setOwnedActive,
		assignedActive,
		setAssignedActive,
		activeTags,
		handleAddTag,
		handleRemoveTag,
		handleResetTags,
	} = useProjectFilters(initialProjects);

	const toggleSelection = (projectId: string) => {
		const newSet = new Set(selectedProjectIds);
		if (newSet.has(projectId)) {
			newSet.delete(projectId);
		} else {
			newSet.add(projectId);
		}
		setSelectedProjectIds(newSet);
	};

	const handleDeleteSelected = () => {
		console.log("Deleting projects:", Array.from(selectedProjectIds));
		setSelectedProjectIds(new Set());
		setIsSelectMode(false);
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
				action={
					<Button
						className="w-full sm:w-auto"
						onClick={() => setIsCreateModalOpen(true)}
					>
						<Plus className="w-4 h-4 mr-2" />
						Create New Project
					</Button>
				}
				filters={
					<>
						<FilterChip
							label="Owned Projects"
							isActive={ownedActive}
							onClick={() => setOwnedActive(!ownedActive)}
						/>
						<FilterChip
							label="Assigned to Me"
							isActive={assignedActive}
							onClick={() => setAssignedActive(!assignedActive)}
						/>
						<div className="flex-1 min-w-5" />
						<TagFilter
							filterDefinitions={projectFilters}
							activeFilters={activeTags}
							onAddFilter={handleAddTag}
							onRemoveFilter={handleRemoveTag}
							onReset={handleResetTags}
						/>
						{/* 3. New Selection Toggle Button */}
						<Button
							variant={isSelectMode ? "default" : "outline"}
							size="sm"
							onClick={() => {
								setIsSelectMode(!isSelectMode);
								if (isSelectMode) setSelectedProjectIds(new Set()); // Clear on exit
							}}
							className="gap-2"
						>
							<CheckSquare className="w-4 h-4" />
							{isSelectMode ? "Cancel Selection" : "Select"}
						</Button>

						{/* 4. Conditional Bulk Delete Button */}
						{isSelectMode && selectedProjectIds.size > 0 && (
							<Button
								variant="destructive"
								size="sm"
								className="gap-2"
								onClick={() => setIsDeleteModalOpen(true)}
							>
								<Trash2 className="w-4 h-4" />
								Delete ({selectedProjectIds.size})
							</Button>
						)}
					</>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredProjects.length > 0 ? (
					filteredProjects.map((project) => (
						<div key={project.id} className="relative">
							{/* Selection Overlay for Cards */}
							{isSelectMode && (
								<button
									type="button"
									aria-label={`Select ${project.title}`}
									className="absolute inset-0 z-10 cursor-pointer rounded-xl border-2 transition-all w-full text-left"
									style={{
										borderColor: selectedProjectIds.has(project.id)
											? "var(--primary)"
											: "transparent",
										backgroundColor: selectedProjectIds.has(project.id)
											? "rgba(var(--primary-rgb), 0.05)"
											: "transparent",
									}}
									onClick={(e) => {
										e.preventDefault();
										toggleSelection(project.id);
									}}
								>
									<div
										className={`absolute top-4 right-4 w-5 h-5 rounded border ${selectedProjectIds.has(project.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"}`}
									>
										{selectedProjectIds.has(project.id) && (
											<CheckSquare className="w-full h-full p-0.5" />
										)}
									</div>
								</button>
							)}

							{/* Pass the isSelectMode prop here */}
							<ProjectCard project={project} isSelectMode={isSelectMode} />
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
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
			/>

			<ActionConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleDeleteSelected}
				title="Delete Projects"
				description={`Are you sure you want to delete ${selectedProjectIds.size} selected project(s)? This action cannot be undone.`}
				confirmText="Delete Projects"
				isDestructive={true}
			/>
		</div>
	);
}
