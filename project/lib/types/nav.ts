import type { LucideIcon } from "lucide-react";

export interface NavItem {
	name: string;
	href: string;
	icon?: LucideIcon;
	current?: boolean;
	subItems?: { name: string; href: string }[];
}

/**
 * One tab in a ViewTabs strip. Generic over the view union so a toolbar cannot
 * be handed a tab value the page does not know how to render.
 *
 * Shared by the project, team and calendar toolbars, so it belongs here rather
 * than inside view-tabs.tsx - a _constants file importing a type out of a
 * component is a dependency pointing the wrong way.
 */
export interface TabOption<T extends string = string> {
	label: string;
	value: T;
}
