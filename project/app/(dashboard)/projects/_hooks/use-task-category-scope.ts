"use client";

import { useParams } from "next/navigation";
import type { CategoryScope } from "@/lib/types/category";

/**
 * use-task-category-scope hook - determines the appropriate workspace category
 * palette for a task by resolving the project ID from props or route parameters,
 * falling back to null for default colors when context is missing.
 */
export function useTaskCategoryScope(projectId?: string): CategoryScope | null {
	const routeParams = useParams();
	const resolvedProjectId =
		projectId ?? (routeParams?.id as string | undefined);

	if (!resolvedProjectId) return null;

	return { kind: "project", id: resolvedProjectId, type: "task" };
}
