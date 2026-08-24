import type { UserProfile } from "@clerk/nextjs";
import type { ComponentProps } from "react";

/**
 * clerk appearance type - derives the appearance type directly from
 * the component props to avoid depending on transitive clerk types
 * that could break during lockfile generation.
 */
type ClerkAppearance = NonNullable<
	ComponentProps<typeof UserProfile>["appearance"]
>;

/**
 * clerk base appearance - establishes a central theming bridge mapping
 * clerk's css variables to the app's design tokens for automatic
 * dark mode and theme synchronization. It intentionally excludes
 * element overrides, keeping layout decisions strictly at the
 * component level.
 */
export const clerkAppearance: ClerkAppearance = {
	variables: {
		colorPrimary: "var(--primary)",
		colorPrimaryForeground: "var(--on-primary)",
		colorBackground: "var(--card)",
		colorForeground: "var(--on-surface)",
		colorMutedForeground: "var(--on-surface-variant)",
		colorInput: "var(--surface-container-lowest)",
		colorInputForeground: "var(--on-surface)",
		colorBorder: "var(--outline-variant)",
		colorDanger: "var(--error)",
		borderRadius: "var(--radius)",
		fontFamily: "var(--font-sans)",
	},
};

/**
 * clerk auth appearance - defines appearance overrides for auth
 * pages, retaining clerk's default card chrome while utilizing
 * inline styles to aggressively hide the footer (branding and links)
 * without fighting specificity. The hidden footer necessitates a
 * custom switch link in the auth shell.
 */
export const clerkAuthAppearance: ClerkAppearance = {
	...clerkAppearance,
	elements: {
		rootBox: { width: "100%" },
		cardBox: { width: "100%" },
		footer: { display: "none" },
	},
};

/**
 * clerk user profile appearance - defines appearance overrides for
 * the settings panel, stripping clerk's nested containers, navbars,
 * and footers via inline styles so it embeds seamlessly inside the
 * app's existing layout and navigation without duplication.
 */
export const clerkUserProfileAppearance: ClerkAppearance = {
	...clerkAppearance,
	elements: {
		rootBox: { width: "100%" },
		cardBox: {
			width: "100%",
			border: "none",
			boxShadow: "none",
			background: "transparent",
		},
		card: { background: "transparent", boxShadow: "none" },
		navbar: { display: "none" },
		navbarMobileMenuRow: { display: "none" },
		/** hide vendor branding - removes vendor branding inside the settings page. */
		footer: { display: "none" },
	},
};
