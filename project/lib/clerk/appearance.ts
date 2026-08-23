import type { UserProfile } from "@clerk/nextjs";
import type { ComponentProps } from "react";

/**
 * Clerk's appearance type, taken from the component that consumes it rather
 * than imported from "@clerk/types" - that package is a transitive dependency
 * here, not a declared one, so importing it directly would work locally and
 * break the moment the lockfile is regenerated.
 */
type ClerkAppearance = NonNullable<
	ComponentProps<typeof UserProfile>["appearance"]
>;

/**
 * One theming bridge between Clerk's prebuilt UI and this app's design tokens.
 *
 * Clerk renders real DOM inside our page, under our stylesheet, so its
 * `variables` accept `var(--token)` references just like any other CSS value.
 * Pointing them at the same custom properties the rest of the app uses means
 * Clerk's chrome re-themes automatically when dark mode is toggled - and will
 * follow the palette picker in Phase 7 without a single edit here, because
 * nothing in this file is a literal colour.
 *
 * Before this existed, `UserProfile`, `UserButton`, `SignIn` and `SignUp` each
 * carried their own inline appearance object, so restyling meant finding four
 * call sites and hoping none had been missed. All four now start from here.
 *
 * Deliberately variables only, no `elements`. A variable is a theme decision and
 * is the same everywhere; an element override is a layout decision that differs
 * per component - the popover in the top bar and the panel in Settings want
 * genuinely different things, and folding both into one object would leave each
 * call site undoing half of it.
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
 * The `SignIn` and `SignUp` widgets on the auth pages.
 *
 * ## Clerk's card IS the card
 *
 * Unlike the Settings panel, nothing here strips Clerk's chrome. The auth pages
 * wrap the widget in nothing of their own, so its border, radius and shadow are
 * the page's only container. An earlier version put our own panel around it and
 * produced two nested cards with two headings - a container inside a container,
 * which reads as a rendering bug rather than as depth.
 *
 * ## Why these are style objects, not class strings
 *
 * `footer: "hidden"` looks like it should work and does not. Clerk injects its
 * own stylesheet at runtime, after ours, so its `.cl-footer { display: flex }`
 * and Tailwind's `.hidden { display: none }` have identical specificity and the
 * later one wins. An inline style is not in the cascade at all and beats both
 * without needing `!important` anywhere.
 *
 * ## What hiding the footer costs
 *
 * Clerk's footer carries two things at once - its "Secured by Clerk" branding
 * and the link that switches between signing in and signing up. Hiding it
 * removes both, so the auth pages must render that switch themselves. Losing it
 * silently would strand someone with no account on a form they cannot leave,
 * which is why `AuthShell` requires `switchHref` rather than defaulting it.
 *
 * The orange "Development mode" strip is not part of this. It comes from using
 * a development Clerk instance and disappears on production keys; hiding it
 * would mean losing the one visible signal that you are pointed at the dev
 * instance.
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
 * The account panel embedded in Settings.
 *
 * Clerk ships its own card chrome - a border, a shadow and a background. All
 * three are stripped because the panel already sits inside one of our cards,
 * and two borders around the same content reads as a rendering bug rather than
 * as depth.
 */
export const clerkUserProfileAppearance: ClerkAppearance = {
	...clerkAppearance,
	elements: {
		rootBox: "w-full",
		cardBox: "w-full border-none shadow-none bg-transparent",
		card: "bg-transparent shadow-none",
		navbar: "border-r border-border rounded-none",
		// Vendor branding inside what reads as our own settings page.
		footer: "hidden",
	},
};
