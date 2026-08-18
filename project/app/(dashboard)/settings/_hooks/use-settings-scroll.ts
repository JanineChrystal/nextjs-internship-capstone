"use client";

import { useEffect } from "react";
import {
	SETTINGS_SECTION_DOM_IDS,
	toNavEntry,
} from "@/lib/constants/settings-nav";
import { useSettingsNavStore } from "@/stores/use-settings-nav-store";

/**
 * Keeps the sidebar's Settings sub-menu in sync with the page, in both
 * directions.
 *
 * Downward: a click in the sidebar writes a scroll request to the store, and the
 * effect below scrolls the matching card into view - and, for the Account and
 * Security entries, also tells Clerk which of its own screens to show.
 *
 * Upward: an IntersectionObserver watches the three cards and reports whichever
 * one the reader is actually looking at, so scrolling by hand moves the
 * highlight without anyone clicking.
 *
 * One observer for all three sections rather than one each: the callback already
 * receives every entry that changed, and a scroll event that crosses two
 * boundaries at once should be resolved together, not by whichever observer
 * happened to fire last.
 */
export function useSettingsScroll(): void {
	const scrollRequest = useSettingsNavStore((state) => state.scrollRequest);
	const consumeScrollRequest = useSettingsNavStore(
		(state) => state.consumeScrollRequest,
	);
	const setActiveFromScroll = useSettingsNavStore(
		(state) => state.setActiveFromScroll,
	);

	// Downward: act on a click that came from the sidebar.
	useEffect(() => {
		if (!scrollRequest) return;

		const entry = toNavEntry(scrollRequest.navId);

		// Clerk's UserProfile reads its current screen from the fragment, so this
		// is how Account and Security land on different pages of the same embed.
		if (entry.clerkHash) {
			window.location.hash = entry.clerkHash;
		}

		// The target may not exist yet. Arriving from another page mounts this
		// component before the code-split account panel has loaded, so a single
		// attempt would silently do nothing on exactly the journey the sub-menu
		// exists for. Retried on a few frames, then given up on rather than
		// looping forever against a section that is genuinely absent.
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

	// Upward: follow the reader's own scrolling.
	useEffect(() => {
		const sections = SETTINGS_SECTION_DOM_IDS.map((id) =>
			document.getElementById(id),
		).filter((element): element is HTMLElement => element !== null);

		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// The section closest to the top of the viewport wins. Taking the
				// most-intersecting one instead would let a very tall card keep the
				// highlight while its heading has already scrolled far out of sight.
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
				// A band across the upper third of the viewport. A plain 0 threshold
				// would activate a section the instant one pixel of it appeared at the
				// very bottom of the screen, which is not what anyone is reading.
				rootMargin: "-80px 0px -60% 0px",
				threshold: 0,
			},
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	}, [setActiveFromScroll]);
}
