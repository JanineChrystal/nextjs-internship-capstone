"use client";

import { useParams } from "next/navigation";
import type { CategoryScope } from "@/lib/types/category";

/**
 * The category palette a task badge should read from.
 *
 * Task categories belong to the workspace that owns the *project*, not to
 * whoever is looking, so the scope has to be built from a project id. A task row
 * usually carries its own; the route param covers the rows that do not, which is
 * every task rendered inside /projects/[id].
 *
 * Returns null when neither is available - a task card shown outside a project
 * route with no project id on the row. The badge then falls back to its
 * generated colour rather than guessing at someone else's palette.
 */
export function useTaskCategoryScope(projectId?: string): CategoryScope | null {
	const routeParams = useParams();
	const resolvedProjectId =
		projectId ?? (routeParams?.id as string | undefined);

	if (!resolvedProjectId) return null;

	return { kind: "project", id: resolvedProjectId, type: "task" };
}
