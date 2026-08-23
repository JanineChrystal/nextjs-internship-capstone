import { KanbanSquare } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One of the two legal links under the card.
 *
 * Both open in a new tab. Navigating away mid-sign-up would throw away a
 * half-filled form and any verification step already in progress - and someone
 * clicking "Privacy Policy" wants to read it before continuing, not instead of
 * continuing.
 *
 * The "(opens in a new tab)" is `sr-only`. A sighted reader gets that from the
 * browser; someone using a screen reader gets no warning at all unless it is
 * said, and a tab that opens unannounced is disorienting.
 */
function LegalLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<Link
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="rounded-sm text-on-surface underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
		>
			{children}
			<span className="sr-only"> (opens in a new tab)</span>
		</Link>
	);
}

interface AuthShellProps {
	children: ReactNode;
	/** The sign-in / sign-up switch that Clerk's hidden footer used to provide. */
	switchPrompt: string;
	switchLabel: string;
	switchHref: string;
}

/**
 * What sits around the Clerk widget on the auth pages.
 *
 * ## Deliberately not a card
 *
 * There is no panel here. Clerk renders its own card - border, radius, shadow,
 * heading and subtitle - and wrapping that in a second card produced exactly
 * what it sounds like: two nested containers and two headings saying the same
 * thing twice. Everything this component adds sits OUTSIDE that card, in the
 * space above and below it.
 *
 * ## Why the switch link is required
 *
 * `clerkAuthAppearance` hides Clerk's footer to remove its branding, and that
 * footer also carried the link between signing in and signing up. `switchHref`
 * has no default for that reason - forgetting it would leave someone with no
 * account stuck on a form with no way out, and a required prop turns that into
 * a compile error rather than a bug found in testing.
 */
export function AuthShell({
	children,
	switchPrompt,
	switchLabel,
	switchHref,
}: AuthShellProps) {
	return (
		<div className="flex w-full max-w-md flex-col items-center">
			{/* The brand mark floats above Clerk's card rather than sitting inside
			    it, so the page says whose product this is without competing with the
			    widget's own heading. */}
			<Link
				href="/"
				className="mb-8 flex items-center gap-2 rounded-lg text-on-surface transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			>
				<span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
					<KanbanSquare aria-hidden="true" className="size-5" />
				</span>
				<span className="text-lg font-semibold tracking-tight">Takda PH</span>
			</Link>

			{children}

			<p className="mt-6 text-center text-sm text-on-surface-variant">
				{switchPrompt}{" "}
				<Link
					href={switchHref}
					className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					{switchLabel}
				</Link>
			</p>

			<p className="mt-4 text-center text-xs leading-relaxed text-on-surface-variant">
				By continuing you agree to our{" "}
				<LegalLink href="/terms">Terms of Service</LegalLink> and{" "}
				<LegalLink href="/privacy">Privacy Policy</LegalLink>.
			</p>
		</div>
	);
}
