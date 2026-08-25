"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * use-section-link hook - resolves cross-page section anchor bugs by ensuring
 * off-page clicks correctly navigate home via router before applying native
 * fragment scrolling, instead of swallowing the event.
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
