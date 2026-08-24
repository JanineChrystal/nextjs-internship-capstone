import type { LucideIcon } from "lucide-react";
import type { SettingsNavId } from "@/lib/types/settings";

/**
 * nav sub item - represents a nested navigation entry, using `settingsSectionId`
 * to drive in-page scroll targets rather than routes for one-page screens.
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
 * nav group - clusters navigation items under a descriptive label, preventing
 * visual fatigue in long sidebars and giving grouping structural meaning.
 */
export interface NavGroup {
	label: string;
	items: NavItem[];
}

/**
 * tab option - defines a generic tab entry for ViewTabs, decoupled from specific
 * component constants to prevent reverse dependency imports in toolbars.
 */
export interface TabOption<T extends string = string> {
	label: string;
	value: T;
}
