"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import projectFilters from "@/app/(dashboard)/_constants/filters";
import { useProjectFilters } from "@/app/(dashboard)/hooks/use-project-filters";
import { Button } from "@/components/ui/buttons/button";
import { FilterChip } from "@/components/ui/filters/filter-chip";
import { TagFilter } from "@/components/ui/filters/tag-filter";
import type { Project } from "@/lib/validations/project-schema";
import { ProjectCard } from "./ui/cards/project-card"; // Adjust path if needed

interface ProjectsClientProps {
	initialProjects: Project[];
}

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
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

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Projects"
				description="Manage and organize your team projects"
				action={
					<Button className="w-full sm:w-auto">
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
					</>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredProjects.length > 0 ? (
					filteredProjects.map((project) => (
						<ProjectCard key={project.id} project={project} />
					))
				) : (
					<div className="col-span-full py-12 text-center text-card-foreground/50">
						No projects found matching the selected filters.
					</div>
				)}
			</div>
		</div>
	);
}
