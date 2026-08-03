import {
	Activity,
	BarChart3,
	Calendar,
	FolderOpen,
	Home,
	Settings,
	Users,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

export const mainNavigation: NavItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: Home,
		current: true,
	},
	{
		name: "Activities",
		href: "/activities",
		icon: Activity,
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
