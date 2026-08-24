import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/brand-mark";

/**
 * legal link - renders external links that open in a new tab with
 * screen-reader announcements to prevent users from losing their
 * in-progress auth forms.
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
 * auth shell - wraps the Clerk widget without adding redundant card
 * styling, and explicitly requires a switch link to replace Clerk's
 * hidden footer branding.
 */
export function AuthShell({
	children,
	switchPrompt,
	switchLabel,
	switchHref,
}: AuthShellProps) {
	return (
		<div className="flex w-full max-w-md flex-col items-center">
			{/*
			  floating brand mark - sits above the Clerk card to establish product
			  identity without competing with the widget's internal headings.
			*/}
			<Link
				href="/"
				className="mb-8 flex items-center gap-2 rounded-lg text-on-surface transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			>
				{/*
				  consistent branding - uses the identical brand mark found in the app
				  dashboard to maintain visual continuity after sign-in.
				*/}
				<BrandMark className="size-9" letterClassName="text-xl" />
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
