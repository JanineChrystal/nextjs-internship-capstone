import { create } from "zustand";
import { toDefaultNavId, toNavEntry } from "@/lib/constants/settings-nav";
import type { SettingsNavId, SettingsSectionDomId } from "@/lib/types/settings";

/**
 * Which part of the Settings page the sub-menu should be highlighting, and
 * where a click asked the page to scroll to.
 *
 * This is in a store rather than in the settings page's own state because the
 * two halves of the interaction live in different component trees: the menu is
 * in the sidebar (rendered by the dashboard layout) and the sections are on the
 * page. Lifting the state to a common ancestor would mean putting settings-page
 * state in the layout that wraps every route.
 *
 * The URL is deliberately not used to carry this. Clerk's `<UserProfile>` runs
 * in `routing="hash"` mode, which means it owns the fragment - writing our own
 * `#notifications` there would fight its router. A query parameter would work
 * but would push a history entry for every scroll, so the back button would walk
 * the user up their own settings page.
 */
interface SettingsNavState {
	activeNavId: SettingsNavId;

	/**
	 * A pending "scroll here" instruction from the sidebar.
	 *
	 * Carries a nonce so clicking the same entry twice fires twice. Without it
	 * the value would be unchanged on the second click, the effect watching it
	 * would not re-run, and the page would sit still - which reads as a broken
	 * link rather than as "you are already there".
	 */
	scrollRequest: { navId: SettingsNavId; nonce: number } | null;

	requestScrollTo: (navId: SettingsNavId) => void;
	consumeScrollRequest: () => void;
	setActiveFromScroll: (domId: SettingsSectionDomId) => void;
	reset: () => void;
}

export const useSettingsNavStore = create<SettingsNavState>((set, get) => ({
	activeNavId: "account",
	scrollRequest: null,

	requestScrollTo: (navId) =>
		set((state) => ({
			activeNavId: navId,
			scrollRequest: {
				navId,
				nonce: (state.scrollRequest?.nonce ?? 0) + 1,
			},
		})),

	consumeScrollRequest: () => set({ scrollRequest: null }),

	/**
	 * Updates the highlight as the user scrolls.
	 *
	 * The guard is what makes the Account/Security pair behave. Both entries map
	 * to the same card, so once someone has clicked Security, reporting that card
	 * as visible must not quietly move the highlight back to Account - they are
	 * still looking at exactly what they asked for.
	 */
	setActiveFromScroll: (domId) => {
		if (toNavEntry(get().activeNavId).domId === domId) return;
		set({ activeNavId: toDefaultNavId(domId) });
	},

	reset: () => set({ activeNavId: "account", scrollRequest: null }),
}));
