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
		colorMuted: "var(--surface-variant)",
		colorInput: "var(--surface-container-lowest)",
		colorInputForeground: "var(--on-surface)",
		colorBorder: "var(--outline-variant)",
		colorDanger: "var(--error)",
		colorSuccess: "var(--success)",
		colorWarning: "var(--warning)",
		colorRing: "var(--ring)",
		/**
		 * the token that fixes the invisible Google button.
		 *
		 * Clerk derives borders, shadows and neutral surfaces - including the
		 * social provider buttons - from `colorNeutral`, and its default is a
		 * hard-coded black. Over a dark card that produces a black-on-black
		 * button, and in light mode a barely-there hairline on white. Pointing it
		 * at the foreground token means it inverts with the theme like everything
		 * else, so the button is visible in both.
		 */
		colorNeutral: "var(--on-surface)",
		borderRadius: "var(--radius)",
		fontFamily: "var(--font-sans)",
	},
	elements: {
		/**
		 * explicit social button - the neutral token alone leaves the button
		 * legible but flat. These give it the same surface and outline as every
		 * other bordered control in the app, so it reads as one of ours.
		 */
		socialButtonsBlockButton: {
			backgroundColor: "var(--surface-container-lowest)",
			borderColor: "var(--outline-variant)",
			borderWidth: "1px",
			borderStyle: "solid",
			color: "var(--on-surface)",
		},
		socialButtonsBlockButtonText: { color: "var(--on-surface)" },
		dividerLine: { backgroundColor: "var(--outline-variant)" },
		dividerText: { color: "var(--on-surface-variant)" },
		formFieldInput: {
			backgroundColor: "var(--surface-container-lowest)",
			borderColor: "var(--outline-variant)",
			color: "var(--on-surface)",
		},
		formFieldLabel: { color: "var(--on-surface)" },
		identityPreviewText: { color: "var(--on-surface)" },
		formResendCodeLink: { color: "var(--primary)" },
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
		/** merged, not replaced - spreading only the top level would drop the base element styles above, taking the social button fix with them. */
		...clerkAppearance.elements,
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
		...clerkAppearance.elements,
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
