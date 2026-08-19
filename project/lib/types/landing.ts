import type { LucideIcon } from "lucide-react";

/**
 * The shapes the public landing page is built from.
 *
 * These live in lib/types rather than beside the page for the usual reason: the
 * constants file declares the data, several section components consume it, and a
 * type declared inside one of those components would point the dependency arrow
 * backwards. Component prop interfaces still stay with their component - those
 * have exactly one consumer.
 */

/**
 * One entry in the landing navigation.
 *
 * `sectionId` is the id of the element it scrolls to, not a route. The whole
 * page is one document, so every nav entry is an in-page anchor; making them
 * routes would mean rendering the same page under five URLs.
 */
export interface LandingNavItem {
	label: string;
	sectionId: string;
	/** Shown in the dropdown panel under Product. */
	description?: string;
	icon?: LucideIcon;
}

/** A large feature panel in the bento grid. */
export interface BentoFeature {
	title: string;
	description: string;
	icon: LucideIcon;
	/** Spans two columns on wide screens when true. */
	wide?: boolean;
}

/** A one-line capability in the dense "everything you need" grid. */
export interface Capability {
	title: string;
	description: string;
	icon: LucideIcon;
}

/** A numbered step in the how-it-works rail. */
export interface WorkflowStep {
	title: string;
	description: string;
}

export interface Testimonial {
	quote: string;
	name: string;
	role: string;
	/** Two initials, used instead of a photo of a person who does not exist. */
	initials: string;
}

export interface PricingTier {
	name: string;
	price: string;
	cadence: string;
	description: string;
	features: string[];
	ctaLabel: string;
	ctaHref: string;
	featured?: boolean;
}

export interface FaqItem {
	question: string;
	answer: string;
}

export interface FooterColumn {
	heading: string;
	links: { label: string; href: string }[];
}
