import type { ThemeMode } from "@/lib/types/theme";
import {
	derivePaletteTokens,
	PALETTE_TOKEN_NAMES,
} from "./derive-palette-tokens";
import { DEFAULT_PALETTE_ID, THEME_PALETTES } from "./palettes";

/** find palette - the palette whose id is `id`, or `null` if nothing matches. */
export function findPalette(id: string) {
	return THEME_PALETTES.find((palette) => palette.id === id) ?? null;
}

/** Whether `id` names a palette that actually exists. */
export function isKnownPaletteId(id: string): boolean {
	return findPalette(id) !== null;
}

/**
 * Writes a palette onto an element as inline custom properties.
 *
 * ## Why inline styles rather than a class
 *
 * The values are computed at runtime - `adjustForContrast` decides them from the
 * swatches and the mode - so there is no stylesheet they could have been written
 * into ahead of time. Generating twelve palettes times two modes as classes
 * would mean 24 blocks of duplicated tokens in `globals.css`, all of which would
 * need regenerating whenever a swatch changed.
 *
 * Inline also settles the precedence question outright. `globals.css` sets these
 * tokens in `:root` and again in `.dark`, both of which sit on the same `<html>`
 * element. An inline declaration on that element beats any selector, so the
 * palette wins in both modes without a specificity fight or an `!important`.
 *
 * ## Why Default removes rather than sets
 *
 * Default's swatches are the blues already hand-authored in `globals.css`, and
 * deriving them would land close to but not exactly on those values - so
 * "choosing Default" would repaint the app very slightly. Removing the inline
 * properties instead hands control back to the stylesheet, which makes Default
 * the one choice that genuinely changes nothing. Anything else would make the
 * option named Default the most surprising one in the list.
 *
 * An unrecognised id is treated the same way. A palette removed from the data
 * file after someone had selected it must fall back to the app's own colours,
 * not to a half-applied set left over from the previous render.
 */
export function applyPaletteTokens(
	root: HTMLElement,
	paletteId: string,
	mode: ThemeMode,
): void {
	const palette =
		paletteId === DEFAULT_PALETTE_ID ? null : findPalette(paletteId);

	if (!palette) {
		for (const name of PALETTE_TOKEN_NAMES) {
			root.style.removeProperty(name);
		}
		return;
	}

	const tokens = derivePaletteTokens(palette, mode);

	// Object.entries rather than iterating PALETTE_TOKEN_NAMES: PaletteTokens is
	// typed with exactly those keys, so the compiler already guarantees the two
	// agree, and reading the values straight off the derived object removes an
	// index lookup that could quietly produce `undefined`.
	for (const [name, value] of Object.entries(tokens)) {
		root.style.setProperty(name, value);
	}
}
