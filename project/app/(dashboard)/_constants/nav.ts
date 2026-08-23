import {
	Archive,
	BarChart3,
	Bell,
	Calendar,
	FolderOpen,
	Home,
	Settings,
	Users,
} from "lucide-react";
import { SETTINGS_NAV } from "@/lib/constants/settings-nav";
import type { NavGroup, NavItem } from "@/lib/types/nav";

/**
 * The sidebar's primary navigation, in two labelled groups.
 *
 * ## Why grouped rather than one list
 *
 * Seven undifferentiated entries is past the point where the eye scans and into
 * where it reads every line. The split is by what the reader is there to do,
 * not by how the app is built:
 *
 * - **Workspace** is the daily loop - where the work is, what happened, when it
 *   is due. These are the entries somebody opens several times an hour.
 * - **Manage** is oversight - measuring, staffing and putting things away.
 *   Visited deliberately, and rarely by everyone on the team.
 *
 * Notifications sits in Workspace rather than with Manage because it is a feed
 * you check, not an administrative surface. It is also the only entry that
 * carries a badge, and a badge in the group people already look at is the point
 * of having one.
 */
export const navigationGroups: NavGroup[] = [
	{
		label: "Workspace",
		items: [
			{ name: "Dashboard", href: "/dashboard", icon: Home },
			{
				// Was "Activities" pointing at /activities, which had no route and 404d.
				name: "Notifications",
				href: "/notifications",
				icon: Bell,
				badge: "unreadNotifications",
			},
			{ name: "Projects", href: "/projects", icon: FolderOpen },
			{ name: "Calendar", href: "/calendar", icon: Calendar },
		],
	},
	{
		label: "Manage",
		items: [
			{ name: "Team", href: "/team", icon: Users },
			{ name: "Analytics", href: "/analytics", icon: BarChart3 },
			{ name: "Archive", href: "/archive", icon: Archive },
		],
	},
];

/**
 * Kept as a flat list for anything that needs every destination without caring
 * how the sidebar arranges them - breadcrumbs and the page title in the top bar
 * both read this rather than flattening the groups themselves.
 */
export const mainNavigation: NavItem[] = navigationGroups.flatMap(
	(group) => group.items,
);

export const bottomNavigation: NavItem[] = [
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		// Every entry points at /settings itself. /settings/security and
		// /settings/appearance were advertised here for months and never existed -
		// both 404d. Rather than create two routes that would each re-render the
		// same page, the settings screen is one page and these scroll to a section
		// of it; settingsSectionId is what the sidebar uses to do that.
		subItems: SETTINGS_NAV.map((entry) => ({
			name: entry.label,
			href: "/settings",
			settingsSectionId: entry.id,
		})),
	},
];
