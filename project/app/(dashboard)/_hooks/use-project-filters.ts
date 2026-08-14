"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/validations/project-schema";

export function useProjectFilters(projects: Project[]) {
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>(
		{},
	);

	const filteredProjects = useMemo(() => {
		return projects.filter((project) => {
			for (const [key, selectedValues] of Object.entries(filterValues)) {
				if (selectedValues.length === 0) continue;

				const projectValue = project[key as keyof typeof project];
				// Handle boolean flags like isOwned if they are mapped to strings
				if (typeof projectValue === "boolean") {
					const stringVal = projectValue ? "true" : "false";
					if (!selectedValues.includes(stringVal)) return false;
				} else if (key === "category") {
					const categoryStr =
						(projectValue as string)?.trim() || "Uncategorized";
					if (!selectedValues.includes(categoryStr.toLowerCase())) return false;
				} else if (typeof projectValue === "string") {
					if (!selectedValues.includes(projectValue.toLowerCase()))
						return false;
				}
			}

			return true;
		});
	}, [projects, filterValues]);

	const handleFilterChange = (fieldId: string, optionValue: string) => {
		setFilterValues((prev) => {
			const current = prev[fieldId] || [];
			const updated = current.includes(optionValue)
				? current.filter((v) => v !== optionValue)
				: [...current, optionValue];

			return {
				...prev,
				[fieldId]: updated,
			};
		});
	};

	const handleResetFilters = () => {
		setFilterValues({});
	};

	return {
		filteredProjects,
		filterValues,
		handleFilterChange,
		handleResetFilters,
	};
}
