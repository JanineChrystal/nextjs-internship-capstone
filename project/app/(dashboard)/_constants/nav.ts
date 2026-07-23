import {
	BarChart3,
	Calendar,
	FolderOpen,
	Home,
	Settings,
	Users,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

const navigation: NavItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: Home,
		current: true,
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
		name: "Settings",
		href: "/settings",
		icon: Settings,
		current: false,
	},
];

export default navigation;
