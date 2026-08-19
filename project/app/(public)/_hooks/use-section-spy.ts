"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks which section of a one-page site is currently being read, and scrolls
 * to one on demand.
 *
 * ## Why an IntersectionObserver rather than a scroll listener
 *
 * The obvious implementation is `window.addEventListener("scroll", ...)` and
 * measuring every section's `getBoundingClientRect()` on each event. That fires
 * dozens of times a second, and each measurement forces the browser to
 * recalculate layout - the pattern known as layout thrashing, and a reliable way
 * to make a page feel sticky on a mid-range phone.
 *
 * An IntersectionObserver instead asks the browser to notify us only when a
 * watched element crosses a threshold. The browser already knows where
 * everything is; it tells us when the answer changes rather than being asked
 * continuously. One observer watches all the sections, not one per section.
 *
 * ## Why the rootMargin looks lopsided
 *
 *     rootMargin: "-88px 0px -55% 0px"
 *                   │            │
 *                   │            └── ignore the bottom 55% of the viewport
 *                   └── ignore the top 88px, which the sticky header covers
 *
 * That shrinks the region that counts as "being read" to a band across the upper
 * third of the screen. Without it, a tall section and the short one after it are
 * both on screen at once and the highlight flickers between them; with it, the
 * highlight follows what is under the reader's eye rather than what happens to
 * be visible.
 */
export function useSectionSpy(sectionIds: readonly string[]) {
	// Local state
	const [activeId, setActiveId] = useState<string | null>(null);

	// Handlers
	const scrollToSection = useCallback((sectionId: string) => {
		const target = document.getElementById(sectionId);
		if (!target) return;

		// Highlight immediately rather than waiting for the observer to catch up.
		// A smooth scroll takes several hundred milliseconds, and a menu that only
		// lights up once the scrolling stops reads as an unresponsive click.
		setActiveId(sectionId);

		// `smooth` is honoured by the browser's own reduced-motion setting: when
		// someone has asked for less animation, browsers jump instead of gliding.
		// That is why this is not conditional here - the platform already did it.
		target.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	// Effects
	useEffect(() => {
		const elements = sectionIds
			.map((id) => document.getElementById(id))
			.filter((element): element is HTMLElement => element !== null);

		if (elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Several sections can report at once, so the topmost intersecting
				// one wins rather than whichever entry the callback happened to list
				// last - otherwise the highlight depends on array order, which is
				// not something the reader can see.
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort(
						(a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
					)[0];

				if (visible) setActiveId(visible.target.id);
			},
			{ rootMargin: "-88px 0px -55% 0px", threshold: 0 },
		);

		for (const element of elements) observer.observe(element);

		// Disconnecting matters: the observer holds a reference to every element
		// it watches, so leaving it alive would keep this page's DOM in memory
		// after navigating into the app.
		return () => observer.disconnect();
	}, [sectionIds]);

	return { activeId, scrollToSection };
}
