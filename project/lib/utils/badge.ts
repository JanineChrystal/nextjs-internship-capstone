import type { CSSProperties } from "react";
import { DYNAMIC_BADGE_PALETTES } from "@/app/(dashboard)/projects/_constants/badges";

// Manage Categories stores whatever an <input type="color"> produced, which is
// always #rrggbb. Anything else is treated as absent rather than trusted into a
// style attribute.
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * A stable colour for a label that has no configured palette entry.
 *
 * Hashing the text rather than picking at random matters: the same tag must get
 * the same colour on every render and in every session, or a board would
 * reshuffle its colours each time you opened it.
 */
export function getDynamicBadgeColor(text: string): string {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		hash = text.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % DYNAMIC_BADGE_PALETTES.length;
	return DYNAMIC_BADGE_PALETTES[index];
}

/**
 * Inline styles for a badge whose colour a user picked, rather than one of the
 * fixed Tailwind palettes.
 *
 * A user-chosen colour cannot be expressed as Tailwind classes - the palettes
 * are compiled ahead of time and there is no class for #7c3aed - so the only
 * honest way to honour the choice is an inline style. The colour is used for the
 * text and, at low alpha, for the fill and border, which is the same
 * text-dark/bg-light relationship the static palettes use and so reads the same
 * in either theme.
 *
 * The alternative was snapping the hex to the nearest built-in palette entry.
 * That keeps the design system airtight, but it silently discards the colour the
 * user picked - which is the bug this exists to fix.
 */
export function getCategoryBadgeStyle(
	color: string | null | undefined,
): CSSProperties | undefined {
	if (!color || !HEX_COLOR_PATTERN.test(color)) return undefined;

	return {
		color,
		backgroundColor: `${color}1f`,
		borderColor: `${color}52`,
	};
}
