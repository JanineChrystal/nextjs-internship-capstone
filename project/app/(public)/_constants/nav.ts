import { BarChart3, CalendarRange, KanbanSquare, Users } from "lucide-react";
import type { LandingNavItem } from "@/lib/types/landing";

/**
 * The landing page is one document, so every nav entry is a section id rather
 * than an href.
 *
 * Keeping the ids here - and having both the navbar and the scroll-spy hook
 * read this one array - is what guarantees the menu can never advertise a
 * section that does not exist. The alternative, hard-coding "#pricing" in the
 * navbar and "pricing" in the observer, is two lists that agree until someone
 * renames one.
 */
export const LANDING_SECTIONS = {
	hero: "hero",
	features: "features",
	workflow: "workflow",
	pricing: "pricing",
	faq: "faq",
} as const;

/** The four entries shown in the header bar. */
export const LANDING_NAV: LandingNavItem[] = [
	{ label: "Features", sectionId: LANDING_SECTIONS.features },
	{ label: "How it works", sectionId: LANDING_SECTIONS.workflow },
	{ label: "Pricing", sectionId: LANDING_SECTIONS.pricing },
	{ label: "FAQ", sectionId: LANDING_SECTIONS.faq },
];

/**
 * The richer panel that drops down under "Features".
 *
 * Every one of these points at the same section - the dropdown exists to say
 * what the product does before you scroll, not to offer four destinations.
 * Pretending otherwise would mean four anchors that all land in the same place,
 * which reads as broken.
 */
export const LANDING_FEATURE_MENU: LandingNavItem[] = [
	{
		label: "Kanban boards",
		sectionId: LANDING_SECTIONS.features,
		description: "Drag-and-drop columns your team actually keeps up to date.",
		icon: KanbanSquare,
	},
	{
		label: "Team & access",
		sectionId: LANDING_SECTIONS.features,
		description: "Roles, groups and invites that survive people joining late.",
		icon: Users,
	},
	{
		label: "Calendar & deadlines",
		sectionId: LANDING_SECTIONS.features,
		description: "Start and due dates in one view, with overdue work surfaced.",
		icon: CalendarRange,
	},
	{
		label: "Analytics",
		sectionId: LANDING_SECTIONS.features,
		description: "Throughput, workload and status, read off real activity.",
		icon: BarChart3,
	},
];

/**
 * The scroll-spy watches every section, including the two the menu does not
 * list. Hero and CTA still have to be observed so that scrolling into them
 * clears the highlight rather than leaving the last menu entry lit while the
 * reader is somewhere else entirely.
 */
export const OBSERVED_SECTION_IDS: string[] = [
	LANDING_SECTIONS.hero,
	LANDING_SECTIONS.features,
	LANDING_SECTIONS.workflow,
	LANDING_SECTIONS.pricing,
	LANDING_SECTIONS.faq,
];
