import {
	BarChart3,
	Bell,
	Calendar,
	FolderOpen,
	Home,
	Settings,
	Users,
} from "lucide-react";
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
];

export const bottomNavigation: NavItem[] = [
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		current: false,
		subItems: [
			{ name: "Account Settings", href: "/settings" },
			{ name: "Security Settings", href: "/settings/security" },
			{ name: "Appearance", href: "/settings/appearance" },
		],
	},
];
