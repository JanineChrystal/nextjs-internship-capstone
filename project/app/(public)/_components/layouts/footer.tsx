"use client";

import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { FOOTER_COLUMNS } from "../../_constants/landing";
import { useSectionLink } from "../../_hooks/use-section-link";
import { useSectionSpy } from "../../_hooks/use-section-spy";

/**
 * footer - renders site navigation with smooth scrolling anchors for
 * on-page links, and opens the contact drawer directly to prevent broken
 * link behavior.
 */
// stable array reference - prevents unnecessary re-renders in useSectionSpy by avoiding a new array literal on every render.
const NO_OBSERVED_SECTIONS: string[] = [];

export function Footer() {
	const { scrollToSection } = useSectionSpy(NO_OBSERVED_SECTIONS);
	const { hrefFor, handleAnchor: onAnchor } = useSectionLink(scrollToSection);
	const openContact = useLandingUiStore((state) => state.openContact);

	// href resolution - processes only section anchors through the router, leaving real paths intact to function correctly across all pages.
	const resolveHref = (href: string) =>
		href.startsWith("#") ? hrefFor(href.slice(1)) : href;

	const handleAnchor = (
		event: React.MouseEvent<HTMLAnchorElement>,
		href: string,
	) => {
		if (!href.startsWith("#")) return;
		onAnchor(event, href.slice(1));
	};

	return (
		<footer className="border-t border-border bg-surface-container-low/40">
			<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
				{/*
  responsive layout - stacks columns on mobile, uses two on small
  screens, and gives the brand block extra width on large screens to
  prevent cramped link text.
*/}
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
					<div className="flex flex-col gap-3 lg:col-span-2">
						<Link
							href="/"
							className="flex items-center gap-2 font-semibold text-on-surface"
						>
							{/*
  consistent branding - displays only the wordmark to match the navbar
  styling.
*/}
							Takda PH
						</Link>
						<p className="max-w-xs text-sm text-secondary">
							A kanban workspace for teams that need to see where the work
							actually stands.
						</p>
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="mt-1 w-fit"
							onClick={openContact}
						>
							Contact us
						</Button>
					</div>

					{FOOTER_COLUMNS.map((column) => (
						<nav
							key={column.heading}
							aria-label={column.heading}
							className="flex flex-col gap-3"
						>
							<h2 className="text-sm font-semibold text-on-surface">
								{column.heading}
							</h2>
							<ul className="flex flex-col gap-2">
								{column.links.map((link) => (
									<li key={link.label}>
										<a
											href={resolveHref(link.href)}
											onClick={(event) => handleAnchor(event, link.href)}
											className="text-sm text-secondary transition-colors hover:text-primary"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</nav>
					))}
				</div>

				<div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
					<p>
						&copy; {new Date().getFullYear()} Takda PH. Built as a capstone
						project.
					</p>
					{/*
  direct links - uses Next.js Link for actual routes, bypassing the
  smooth scroll anchor logic used above.
*/}
					<nav aria-label="Legal" className="flex items-center gap-4">
						<Link
							href="/privacy"
							className="transition-colors hover:text-primary"
						>
							Privacy
						</Link>
						<Link
							href="/terms"
							className="transition-colors hover:text-primary"
						>
							Terms
						</Link>
						<span>Made in the Philippines.</span>
					</nav>
				</div>
			</div>
		</footer>
	);
}
