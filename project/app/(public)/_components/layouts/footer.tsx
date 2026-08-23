"use client";

import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { useLandingUiStore } from "@/stores/use-landing-ui-store";
import { FOOTER_COLUMNS } from "../../_constants/landing";
import { useSectionLink } from "../../_hooks/use-section-link";
import { useSectionSpy } from "../../_hooks/use-section-spy";

/**
 * The footer.
 *
 * Its in-page links go through the same `useSectionSpy` scroll helper the navbar
 * uses, so "Pricing" behaves identically whether it is clicked at the top or the
 * bottom of the page. Writing a second scroll implementation here is the obvious
 * shortcut and the reason footer anchors so often jump abruptly while the header
 * ones glide.
 *
 * The Contact entry is a button rather than a link, because it opens a panel
 * rather than going anywhere. Marking it up as a link would promise a
 * destination - and would break middle-click and "open in new tab", which a user
 * is entitled to expect from anything that looks like a link.
 */
// A stable empty array: useSectionSpy watches nothing here, and a fresh `[]`
// literal each render would be a new reference and re-run its effect every time.
const NO_OBSERVED_SECTIONS: string[] = [];

export function Footer() {
	const { scrollToSection } = useSectionSpy(NO_OBSERVED_SECTIONS);
	const { hrefFor, handleAnchor: onAnchor } = useSectionLink(scrollToSection);
	const openContact = useLandingUiStore((state) => state.openContact);

	// The configured hrefs are a mix: section anchors like "#pricing" and, in
	// principle, real paths. Only the anchors are rewritten - a real path is
	// already correct from any page.
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
				{/* One column on a phone, two from sm, and the brand block taking its
				    own wider column from lg - so the link lists never squeeze to two
				    words per line. */}
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
					<div className="flex flex-col gap-3 lg:col-span-2">
						<Link
							href="/"
							className="flex items-center gap-2 font-semibold text-on-surface"
						>
							{/* Wordmark only, matching the navbar above it. */}
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
					{/* Real routes, not section anchors like the columns above - which
					    is why these are `Link` and skip the anchor handler. */}
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
