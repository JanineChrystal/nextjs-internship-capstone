"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Makes the landing page's section anchors work from other public pages.
 *
 * ## The bug this exists to stop
 *
 * The navbar and footer were written when the public group was one document, so
 * every entry rendered `href="#pricing"` and unconditionally called
 * `preventDefault()` before handing off to a smooth-scroll helper. That helper
 * looks the element up and returns early when it is missing:
 *
 *     const target = document.getElementById(sectionId);
 *     if (!target) return;
 *
 * On a page that has no such section - Privacy or Terms - the two lines
 * combine into a dead control. The default navigation is cancelled, the scroll
 * finds nothing, and the click does nothing at all: no movement, no feedback,
 * no error. The worst kind of broken, because it looks fine.
 *
 * ## What it does instead
 *
 * On the landing page, behaviour is unchanged: the anchor is in-page and the
 * smooth scroll is layered over it. Anywhere else the href becomes `/#pricing`
 * and the click is left alone, so the browser navigates home and the platform's
 * own fragment handling does the scrolling on arrival.
 *
 * The href is adjusted as well as the handler, deliberately. Skipping only the
 * `preventDefault` would let the browser follow `#pricing` on `/privacy`,
 * producing `/privacy#pricing` - a URL that goes nowhere and stays in history.
 */
export function useSectionLink(scrollToSection: (sectionId: string) => void) {
	const pathname = usePathname();
	const isLanding = pathname === "/";

	const hrefFor = useCallback(
		(sectionId: string) => (isLanding ? `#${sectionId}` : `/#${sectionId}`),
		[isLanding],
	);

	const handleAnchor = useCallback(
		(event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
			// Off the landing page the anchor is a real cross-page link. Leaving the
			// event alone is the whole point - the browser does it better than we
			// would, including middle-click and open-in-new-tab.
			if (!isLanding) return;

			event.preventDefault();
			scrollToSection(sectionId);
		},
		[isLanding, scrollToSection],
	);

	return { isLanding, hrefFor, handleAnchor };
}
