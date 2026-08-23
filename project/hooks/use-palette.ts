"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { applyPaletteTokens } from "@/lib/theme/apply-palette";
import { THEME_PALETTES } from "@/lib/theme/palettes";
import type { ThemePalette } from "@/lib/types/theme";
import { usePaletteStore } from "@/stores/use-palette-store";

interface UsePaletteResult {
	/** Every palette on offer, in the order the picker should show them. */
	palettes: ThemePalette[];
	/** The id currently in force. */
	paletteId: string;
	/** False until the stored choice has been read - see the store. */
	isHydrated: boolean;
	/** Choose a palette. Applies immediately and is remembered. */
	selectPalette: (paletteId: string) => void;
}

/**
 * The palette picker's whole interface, for any surface that offers one.
 *
 * This is the shared piece the Settings page's Appearance section and the
 * landing page's appearance drawer both consume, through the one `PaletteGrid`
 * they both render. Neither knows how a palette becomes a colour, where the
 * choice is stored, or that light and dark derive different values from the same
 * swatches - which is the point. A second picker added anywhere else in the app
 * gets all of that by calling this.
 *
 * Deliberately read-and-write but *not* apply: applying is a document-level
 * side effect that must happen exactly once, and a hook that did it here would
 * fire once per mounted picker. See `usePaletteEffect`.
 */
export function usePalette(): UsePaletteResult {
	const paletteId = usePaletteStore((state) => state.paletteId);
	const isHydrated = usePaletteStore((state) => state.isHydrated);
	const setPaletteId = usePaletteStore((state) => state.setPaletteId);

	return {
		palettes: THEME_PALETTES,
		paletteId,
		isHydrated,
		selectPalette: setPaletteId,
	};
}

/**
 * Keeps the document's custom properties in step with the chosen palette.
 *
 * Call this exactly once, from a component mounted for the whole app. It is
 * separate from `usePalette` because it is a side effect on `<html>` rather than
 * a value: running it inside the picker would apply the palette only while a
 * picker happened to be on screen, so the app would revert to its default
 * colours the moment the reader navigated away from Settings.
 *
 * ## Why the mode is a dependency
 *
 * The tokens are derived per mode - light mode's accent comes from the dark end
 * of the ramp and dark mode's from the light end - and they are written as
 * inline styles, which outrank the `.dark` block in `globals.css`. So toggling
 * dark mode without re-deriving would leave light mode's accent pinned over a
 * dark page: a dark blue on near-black, unreadable. Re-running on `theme` is
 * what makes the two settings independent rather than one overriding the other.
 */
export function usePaletteEffect(): void {
	const { theme } = useTheme();
	const paletteId = usePaletteStore((state) => state.paletteId);
	const hydrate = usePaletteStore((state) => state.hydrate);

	useEffect(() => {
		hydrate();
	}, [hydrate]);

	useEffect(() => {
		applyPaletteTokens(document.documentElement, paletteId, theme);
	}, [paletteId, theme]);
}
