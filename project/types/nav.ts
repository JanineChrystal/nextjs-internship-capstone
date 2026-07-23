import type { LucideIcon } from "lucide-react";

export interface NavItem {
	name: string;
	href: string;
	icon: LucideIcon;
	current: boolean;
}
