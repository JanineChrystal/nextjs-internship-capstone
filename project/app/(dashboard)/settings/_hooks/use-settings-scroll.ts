"use client";

import { useEffect } from "react";
import {
	SETTINGS_SECTION_DOM_IDS,
	toNavEntry,
} from "@/lib/constants/settings-nav";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";

/**
 * use-settings-scroll hook - synchronizes the settings sidebar sub-menu with the
 * page scroll position in both directions, driving scroll-into-view from sidebar
 * clicks and updating sidebar highlights via a unified IntersectionObserver.
 */
export function useSettingsScroll(): void {
	const scrollRequest = useSettingsNavStore((state) => state.scrollRequest);
	const consumeScrollRequest = useSettingsNavStore(
		(state) => state.consumeScrollRequest,
	);
	const setActiveFromScroll = useSettingsNavStore(
		(state) => state.setActiveFromScroll,
	);

	// downward sync - executes navigation requests originating from sidebar interactions.
	useEffect(() => {
		if (!scrollRequest) return;

		const entry = toNavEntry(scrollRequest.navId);

		// clerk navigation bridge - pushes the requested screen fragment to the URL so Clerk's embedded profile routes itself correctly.
		if (entry.clerkHash) {
			window.location.hash = entry.clerkHash;
		}

		// async scroll retry - polls for dynamically loaded targets before giving up, ensuring delayed components still scroll into view.
		let attempts = 0;
		let timer: ReturnType<typeof setTimeout>;

		const attempt = () => {
			const target = document.getElementById(entry.domId);

			if (target) {
				target.scrollIntoView({ behavior: "smooth", block: "start" });
				consumeScrollRequest();
				return;
			}

			attempts += 1;
			if (attempts > 10) {
				consumeScrollRequest();
				return;
			}
			timer = setTimeout(attempt, 80);
		};

		attempt();
		return () => clearTimeout(timer);
	}, [scrollRequest, consumeScrollRequest]);

	// upward sync - monitors viewport intersections to highlight the active section in the sidebar.
	useEffect(() => {
		const sections = SETTINGS_SECTION_DOM_IDS.map((id) =>
			document.getElementById(id),
		).filter((element): element is HTMLElement => element !== null);

		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// top edge priority - favors the section nearest the viewport ceiling to prevent tall cards from dominating the highlight incorrectly.
				const visible = entries
					.filter((observed) => observed.isIntersecting)
					.sort(
						(a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
					)[0];

				if (!visible) return;
				setActiveFromScroll(
					visible.target.id as (typeof SETTINGS_SECTION_DOM_IDS)[number],
				);
			},
			{
				// intersection bounds - restricts the active zone to the upper viewport area so sections don't highlight prematurely when entering from the bottom.
				rootMargin: "-80px 0px -60% 0px",
				threshold: 0,
			},
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	}, [setActiveFromScroll]);
}
