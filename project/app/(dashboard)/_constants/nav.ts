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
import type { NavItem } from "@/lib/types/nav";

export const mainNavigation: NavItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: Home,
		current: true,
	},
	{
		// Was "Activities" pointing at /activities, which had no route and 404d.
		name: "Notifications",
		href: "/notifications",
		icon: Bell,
		current: false,
	},
	{
		name: "Projects",
		href: "/projects",
		icon: FolderOpen,
		current: false,
	},
	{
		name: "Team",
		href: "/team",
		icon: Users,
		current: false,
	},
	{
		name: "Analytics",
		href: "/analytics",
		icon: BarChart3,
		current: false,
	},
	{
		name: "Calendar",
		href: "/calendar",
		icon: Calendar,
		current: false,
	},
	{
		name: "Archive",
		href: "/archive",
		icon: Archive,
		current: false,
	},
];

export const bottomNavigation: NavItem[] = [
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		current: false,
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
