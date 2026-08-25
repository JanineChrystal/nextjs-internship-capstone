"use client";

import { usePaletteEffect } from "@/hooks/use-palette";

/**
 * palette effect - universally applies the chosen palette to the document
 * by running an effect from a permanently mounted client component, intentionally
 * separated from ThemeProvider to decouple color themes from dark mode logic.
 */
export function PaletteEffect() {
	usePaletteEffect();
	return null;
}
