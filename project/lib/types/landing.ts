import type { LucideIcon } from "lucide-react";

/**
 * landing types - defines the shapes the public landing page is built from,
 * placed in types rather than constants to prevent dependency inversion where
 * generic sections would depend on the components they configure.
 */

/**
 * landing navigation item - defines a single entry in the public landing page's
 * navigation, targeting in-page anchor IDs rather than routing to new URLs.
 */
export interface LandingNavItem {
	label: string;
	sectionId: string;
	/** Shown in the dropdown panel under Product. */
	description?: string;
	icon?: LucideIcon;
}

/**
 * bento feature - describes a large feature panel within the landing page's
 * bento grid layout, optionally supporting wide column spans.
 */
export interface BentoFeature {
	title: string;
	description: string;
	icon: LucideIcon;
	/** Spans two columns on wide screens when true. */
	wide?: boolean;
}

/**
 * capability - defines a concise, single-line capability entry for the dense
 * feature grid on the landing page.
 */
export interface Capability {
	title: string;
	description: string;
	icon: LucideIcon;
}

/**
 * workflow step - describes a numbered sequence step within the how-it-works
 * rail.
 */
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
