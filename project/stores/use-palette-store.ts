import { create } from "zustand";
import { isKnownPaletteId } from "@/lib/theme/apply-palette";
import { DEFAULT_PALETTE_ID } from "@/lib/theme/palettes";

/** Where the choice is remembered. Matches how `ThemeProvider` stores the mode. */
export const PALETTE_STORAGE_KEY = "palette";

/**
 * Which colour palette the reader has chosen.
 *
 * ## Why a store and not component state
 *
 * Three places need this and none of them contains the others: the picker on the
 * Settings page, the picker in the landing page's appearance drawer, and the
 * effect at the root of the app that actually writes the tokens. Lifting it to a
 * common ancestor would mean putting palette state in the root layout that wraps
 * every route, which is the same reasoning that put the settings sub-menu in a
 * store.
 *
 * ## Why the choice is not stored in the database
 *
 * It is a per-browser preference, exactly like light and dark mode, and it is
 * kept next to it in `localStorage`. Persisting it per user would need a column,
 * a migration and a round trip before the first paint - and it would still be
 * wrong for the landing page, where the picker is offered to people who are not
 * signed in and have no row to write to.
 */
interface PaletteState {
	paletteId: string;

	/**
	 * Whether the stored choice has been read yet.
	 *
	 * The server cannot see `localStorage`, so the first render is always the
	 * default. Without this flag the picker would mark Default as current for a
	 * frame before flipping to the real choice, which reads as the app forgetting
	 * the setting and then remembering it.
	 */
	isHydrated: boolean;

	setPaletteId: (paletteId: string) => void;
	hydrate: () => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
	paletteId: DEFAULT_PALETTE_ID,
	isHydrated: false,

	setPaletteId: (paletteId) => {
		if (!isKnownPaletteId(paletteId)) return;

		set({ paletteId });

		/** safe storage write - catches errors from blocked site data or private windows to prevent the color picker from crashing. */
		try {
			window.localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
		} catch {
			/** graceful failure - deliberately ignores write errors to avoid UI crashes. */
		}
	},

	hydrate: () => {
		let stored: string | null = null;

		try {
			stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
		} catch {
			stored = null;
		}

		/** invalid palette guard - validates stored palette IDs against known ones to prevent devtools changes or old deploys from removing all styles. */
		set({
			paletteId:
				stored && isKnownPaletteId(stored) ? stored : DEFAULT_PALETTE_ID,
			isHydrated: true,
		});
	},
}));
