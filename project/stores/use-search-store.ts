import { create } from "zustand";

/**
 * Whether the global search palette is open.
 *
 * Only the open flag lives here. The term, the results and the highlighted row
 * belong to the palette itself and are thrown away when it closes, so putting
 * them in a global store would mean remembering to reset four things instead of
 * unmounting one component.
 *
 * A store is needed for the flag alone because two unrelated components read it:
 * the top bar renders the trigger, and the dialog renders the palette. They sit
 * in different branches of the layout, so the alternative is lifting the state
 * into the layout and passing it down through both - the same prop-drilling the
 * landing page's drawer store exists to avoid.
 */
interface SearchState {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
