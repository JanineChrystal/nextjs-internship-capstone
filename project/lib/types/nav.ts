import type { LucideIcon } from "lucide-react";
import type { SettingsNavId } from "@/lib/types/settings";

/**
 * One entry under a collapsible nav item.
 *
 * `settingsSectionId` is what turns a sub-item from a link into a scroll
 * target. When present, the sub-item stays on the current page and asks the
 * settings store to scroll instead of navigating - which is the only way a
 * one-page settings screen can have a working sub-menu without inventing routes
 * that would each have to render the whole page again.
 */
export interface NavSubItem {
	name: string;
	href: string;
	settingsSectionId?: SettingsNavId;
}

export interface NavItem {
	name: string;
	href: string;
	icon?: LucideIcon;
	current?: boolean;
	subItems?: NavSubItem[];
	/**
	 * Which live counter, if any, this entry shows as a badge.
	 *
	 * A key rather than a number: the constants file is static and imported by
	 * server code, so it cannot hold a value that changes per request. The
	 * sidebar resolves the key against counts it fetches itself, which keeps the
	 * navigation shape declarative and the data loading in one place.
	 */
	badge?: "unreadNotifications";
}

/**
 * A labelled run of nav entries.
 *
 * The sidebar was a single flat list of seven items, which is past the point
 * where a reader scans and into where they read every line. Grouping gives the
 * eye somewhere to land, and the label is what makes the grouping mean
 * something rather than looking like arbitrary gaps.
 */
export interface NavGroup {
	label: string;
	items: NavItem[];
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
