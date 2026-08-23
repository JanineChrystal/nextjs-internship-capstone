import { ImageResponse } from "next/og";

/**
 * The browser-tab icon, drawn rather than uploaded.
 *
 * ## Why a route and not a file in public/
 *
 * The mark is a letter on a coloured tile, and `BrandMark` already draws
 * exactly that in the sidebar and above the sign-in form. Shipping a separate
 * PNG alongside it would mean two definitions of the same logo that have to be
 * kept in step by hand - and the first time the brand colour changed, one of
 * them would be forgotten.
 *
 * Next's `app/icon.tsx` convention renders this once at build time, hashes the
 * output and emits the `<link rel="icon">` tag itself, so there is nothing to
 * remember to update.
 *
 * ## Why the colour is a literal here, unusually
 *
 * Everywhere else in this codebase a colour is a token. This runs in a
 * standalone image renderer with no stylesheet and no CSS custom properties -
 * `var(--primary)` would resolve to nothing and the tile would come out
 * transparent. The value is light mode's `--primary`, kept beside a note saying
 * so, because a favicon has no theme to follow: it sits in browser chrome that
 * is neither this app's light nor its dark surface.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				// Matches --primary in light mode. See the note above.
				background: "#003178",
				color: "#ffffff",
				// A tab icon is 16px on screen once the browser scales it, so the
				// letter is set heavier and tighter than the on-page mark - fine
				// detail is the first thing lost at that size.
				fontSize: 22,
				fontWeight: 700,
				borderRadius: 6,
			}}
		>
			T
		</div>,
		size,
	);
}
