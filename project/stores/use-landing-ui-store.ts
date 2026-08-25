import { create } from "zustand";

/**
 * Which of the landing page's two drawers is open.
 *
 * ## Why a store rather than useState in the layout
 *
 * Both drawers are opened from more than one place, and those places are in
 * different branches of the tree:
 *
 *     the floating dock (bottom-right)  ──┐
 *     the "Contact us" pricing card    ──┼──►  the contact drawer
 *     the footer's Contact link        ──┘
 *
 * Lifting the state to their nearest common ancestor means the layout, so every
 * section would have to receive an `onOpenContact` prop and pass it down purely
 * to hand it to one button several levels deep. That is prop drilling for state
 * that is genuinely global to the page, and it is the situation this codebase
 * already uses Zustand for elsewhere (the settings scroll store solves the same
 * sidebar-to-page problem).
 *
 * Deliberately not the URL: opening a drawer is not a place, and putting it in
 * the query string would add a history entry so the browser Back button closed a
 * panel instead of leaving the page.
 */
interface LandingUiState {
	isContactOpen: boolean;
	isAppearanceOpen: boolean;
	openContact: () => void;
	openAppearance: () => void;
	setContactOpen: (open: boolean) => void;
	setAppearanceOpen: (open: boolean) => void;
}

export const useLandingUiStore = create<LandingUiState>((set) => ({
	isContactOpen: false,
	isAppearanceOpen: false,

	/** exclusive open - opening one drawer automatically closes the other to prevent focus trapping between stacked overlays. */
	openContact: () => set({ isContactOpen: true, isAppearanceOpen: false }),
	openAppearance: () => set({ isAppearanceOpen: true, isContactOpen: false }),

	setContactOpen: (open) => set({ isContactOpen: open }),
	setAppearanceOpen: (open) => set({ isAppearanceOpen: open }),
}));
