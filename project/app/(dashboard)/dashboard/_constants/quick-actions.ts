import { BarChart3, CalendarDays, FolderOpen, Users } from "lucide-react";
import type { NavItem } from "@/lib/types/nav";

/**
 * The dashboard's shortcut list.
 *
 * These are real links, not buttons that open a modal from another page's state.
 * The previous version rendered three buttons with no handler attached at all,
 * so every one of them did nothing when clicked - which is worse than not
 * offering the shortcut.
 */
export const QUICK_ACTIONS: NavItem[] = [
	{
		name: "Go to Projects",
		href: "/projects",
		icon: FolderOpen,
		current: false,
	},
	{
		name: "Manage your team",
		href: "/team",
		icon: Users,
		current: false,
	},
	{
		name: "Open the calendar",
		href: "/calendar",
		icon: CalendarDays,
		current: false,
	},
	{
		name: "See full analytics",
		href: "/analytics",
		icon: BarChart3,
		current: false,
	},
];
