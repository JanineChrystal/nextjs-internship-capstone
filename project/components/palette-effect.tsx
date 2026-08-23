"use client";

import { usePaletteEffect } from "@/hooks/use-palette";

/**
 * Applies the chosen palette to the document, for the life of the app.
 *
 * Renders nothing. It exists because the palette has to be written to `<html>`
 * from somewhere that is always mounted, and the root layout is a server
 * component that cannot run an effect itself.
 *
 * Kept as its own component rather than folded into `ThemeProvider` so that the
 * two settings stay separable: light and dark mode is a working feature with its
 * own storage key and its own consumers, and threading a second concern through
 * it would mean every future change to either one has to be reasoned about
 * against the other. This mounts *inside* the provider because it reads the
 * current mode - the palette derives different values for light and dark.
 */
export function PaletteEffect() {
	usePaletteEffect();
	return null;
}
