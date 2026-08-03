"use client";

import { useMemo, useState } from "react";
import type { ActiveFilter } from "@/components/ui/filters/tag-filter";
import type { Project } from "@/lib/validations/project-schema";

export function useProjectFilters(projects: Project[]) {
	// 1. All filter states live here
	const [ownedActive, setOwnedActive] = useState(false);
	const [assignedActive, setAssignedActive] = useState(false);
	const [activeTags, setActiveTags] = useState<ActiveFilter[]>([]);

	// 2. The useMemo logic (Now correctly using 'projects' instead of 'initialProjects')
	const filteredProjects = useMemo(() => {
		return projects.filter((project) => {
			// --- Tag Filters Logic ---
			if (activeTags.length > 0) {
				const matchesAllTags = activeTags.every((tag) => {
					return project[tag.key as keyof typeof project] === tag.value;
				});

				if (!matchesAllTags) return false;
			}

			// --- Quick Filters Logic ---
			// if (ownedActive && !project.isOwned) return false;
			// if (assignedActive && !project.isAssigned) return false;

			return true;
		});
	}, [projects, activeTags]);

	// 3. Helper functions for the TagFilter component
	const handleAddTag = (newFilter: ActiveFilter) => {
		setActiveTags((prev) => [
			...prev.filter((f) => f.key !== newFilter.key),
			newFilter,
		]);
	};

	const handleRemoveTag = (key: string) => {
		setActiveTags((prev) => prev.filter((f) => f.key !== key));
	};

	const handleResetTags = () => {
		setActiveTags([]);
	};

	// 4. Expose only what the UI needs to render and interact
	return {
		filteredProjects,
		ownedActive,
		setOwnedActive,
		assignedActive,
		setAssignedActive,
		activeTags,
		setActiveTags,
		handleAddTag,
		handleRemoveTag,
		handleResetTags, // Fixed the syntax error and removed the duplicate 'resetTags'
	};
}
