import { FolderOpen, SquareCheckBig, Users } from "lucide-react";
import type { SearchResultKind } from "@/lib/types/search";

/**
 * How each kind of hit is presented.
 *
 * A config map rather than a switch inside the list component, so the renderer
 * stays layout-only and adding a fourth searchable kind is an entry here plus a
 * query - not an edit to the component.
 *
 * `order` is the order the groups appear in, and it is a judgment about what
 * people search for: a project is the biggest thing and the most likely target,
 * a task the most numerous, and a person the least ambiguous - if you searched
 * someone's name you already know which of the three you meant.
 */
export const SEARCH_GROUP_CONFIG: Record<
	SearchResultKind,
	{ label: string; icon: typeof FolderOpen; order: number }
> = {
	project: { label: "Projects", icon: FolderOpen, order: 0 },
	task: { label: "Tasks", icon: SquareCheckBig, order: 1 },
	person: { label: "People", icon: Users, order: 2 },
};

/** The groups in render order, paired with the key each result list uses. */
export const SEARCH_GROUPS: {
	kind: SearchResultKind;
	resultsKey: "projects" | "tasks" | "people";
}[] = [
	{ kind: "project", resultsKey: "projects" },
	{ kind: "task", resultsKey: "tasks" },
	{ kind: "person", resultsKey: "people" },
];
