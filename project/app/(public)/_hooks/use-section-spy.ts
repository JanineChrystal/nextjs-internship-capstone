"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * use-section-spy hook - uses IntersectionObserver to track the active
 * reading section efficiently without layout thrashing, using an asymmetric
 * rootMargin to account for sticky headers.
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
