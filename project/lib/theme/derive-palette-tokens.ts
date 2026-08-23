import type { PaletteTokens, ThemeMode, ThemePalette } from "@/lib/types/theme";
import {
	adjustForContrast,
	chroma,
	contrastRatio,
	DARK_INK,
	LIGHT_INK,
	lightnessOf,
	MIN_TEXT_CONTRAST,
	readableInkOn,
	shiftLightness,
	worstRampContrast,
} from "./color";

/**
 * The page colour each mode derives against.
 *
 * These duplicate `--surface` from `app/globals.css`, which is not ideal - but
 * the alternative is reading the computed style, which would make this function
 * depend on a live DOM and stop it being testable. The duplication is two values
 * that have not changed since the design system was written, and it is called
 * out here so the next person editing `--surface` knows to look.
 */
const LIGHT_SURFACE = "#f9f9f9";
const DARK_SURFACE = "#1a1c1c";

/**
 * The five custom properties a palette is allowed to move.
 *
 * Exported because the applier needs the same list to *remove* them again when
 * the reader picks Default, and two hand-maintained copies of a list like this
 * drift the moment a sixth token is added.
 */
export const PALETTE_TOKEN_NAMES = [
	"--primary",
	"--on-primary",
	"--primary-container",
	"--on-primary-container",
	"--surface-tint",
	"--gradient-from",
	"--gradient-to",
	"--on-gradient",
] as const;

/**
 * How far apart the two ends of a gradient must be in lightness.
 *
 * Below this the surface reads as a flat fill someone forgot to finish. It
 * matters most on the low-chroma palettes - Dark Forest is grey at every step,
 * so its gradient can only be told from a solid colour by how light each end is.
 * The alternative considered was rendering those palettes flat; separating them
 * is better, because a grey-to-grey ramp is still a gradient and still catches
 * the light the way the reference design does.
 */
const MIN_GRADIENT_SEPARATION = 0.14;

/**
 * A gradient pair for one palette and mode, legible along its whole length.
 *
 * Three steps, in order:
 *
 * 1. **Take two steps from the palette itself**, so the surface keeps the
 *    theme's character rather than being a tint of the derived accent.
 * 2. **Push them apart** if they are too close to read as a ramp.
 * 3. **Move both together** until the worst point of the ramp - not either end -
 *    clears the text floor against whichever ink suits it better.
 *
 * Step 3 moves the pair rather than re-picking, so the separation established in
 * step 2 survives; and it moves *both* ends by the same amount, so the ramp
 * keeps its shape instead of one end sliding into the other.
 */
function deriveGradient(
	swatches: ThemePalette["swatches"],
	mode: ThemeMode,
): { from: string; to: string; ink: string } {
	let from = mode === "dark" ? swatches[0] : swatches[1];
	let to = mode === "dark" ? swatches[2] : swatches[3];

	// 2. Separation.
	const gap = lightnessOf(to) - lightnessOf(from);
	if (Math.abs(gap) < MIN_GRADIENT_SEPARATION) {
		const push = (MIN_GRADIENT_SEPARATION - Math.abs(gap)) / 2;
		from = shiftLightness(from, -push);
		to = shiftLightness(to, push);
	}

	// 3. Legibility along the ramp.
	const ink =
		worstRampContrast(from, to, LIGHT_INK) >=
		worstRampContrast(from, to, DARK_INK)
			? LIGHT_INK
			: DARK_INK;

	// Away from the ink: darker under white text, lighter under dark text.
	const direction = ink === LIGHT_INK ? -1 : 1;

	// A linear walk rather than a binary search, because shifting the pair is not
	// monotonic the way shifting one colour is - clamping at black or white can
	// flatten the ramp and *reduce* contrast again. Stepping means the first
	// passing value found is also the smallest one tried.
	for (let step = 0; step <= 20; step += 1) {
		const delta = direction * step * 0.05;
		const candidateFrom = shiftLightness(from, delta);
		const candidateTo = shiftLightness(to, delta);

		if (
			worstRampContrast(candidateFrom, candidateTo, ink) >= MIN_TEXT_CONTRAST
		) {
			return { from: candidateFrom, to: candidateTo, ink };
		}
	}

	// Unreachable for any palette in this project - the loop reaches pure black or
	// white, where one of the two inks always clears 4.5:1. Returned rather than
	// thrown so a future palette that somehow defeated it would render a slightly
	// low-contrast panel instead of taking down the page.
	return {
		from: shiftLightness(from, direction),
		to: shiftLightness(to, direction),
		ink,
	};
}

/**
 * Below this, a swatch reads as off-white or grey rather than as a colour.
 *
 * Calibrated against the two ends of the real data: the Default palette's
 * lightest step (`#b0c6ff`) sits at 0.31 and is unmistakably blue, while
 * Sunrise's (`#fdfbd5`) sits at 0.16 and reads as cream. 0.2 separates them with
 * room on either side.
 */
const MIN_ACCENT_CHROMA = 0.2;

/**
 * The swatch dark mode should take its accent from.
 *
 * The lightest step is the natural choice and is what the hand-authored dark
 * theme uses - `#b0c6ff`, the top of the Default ramp. But several palettes end
 * in a pale tint rather than a light colour, and taking it literally gave
 * Sunrise a cream accent, Berry a near-white one, and Cloud Berry and Mocha the
 * same: four themes that were legible, correct, and indistinguishable from each
 * other in dark mode.
 *
 * So the lightest step is used when it still carries colour, and otherwise the
 * ramp is walked inward to the first step that does. Nothing here overrides
 * contrast - whatever this returns still goes through `adjustForContrast`.
 *
 * ## Why light mode does not do this
 *
 * Light mode takes its accent from the dark end, where the failure mode does not
 * arise the same way: a near-black teal still reads as dark and deliberate,
 * whereas a near-white cream on a dark page reads as an absence of choice. In
 * dark mode the accent is the brightest thing on screen and is carrying the
 * theme's identity; in light mode it is carrying contrast, and identity is
 * carried by the container and the tint alongside it.
 */
function pickDarkAccent(swatches: ThemePalette["swatches"]): string {
	for (let index = swatches.length - 1; index >= 0; index -= 1) {
		const swatch = swatches[index];
		if (chroma(swatch) >= MIN_ACCENT_CHROMA) return swatch;
	}

	// A palette of pure greys - Dark Forest comes closest. There is no coloured
	// step to find, so the lightest one is still the right answer.
	return swatches[5];
}

/**
 * Turns one palette into the custom properties that repaint the app's accent.
 *
 * ## Why only five properties
 *
 * The app has roughly forty-five tokens. A palette moves five of them, and the
 * restraint is the design, not an unfinished job:
 *
 * - **Surfaces stay neutral.** Repainting the page from a six-swatch ramp means
 *   every piece of text on it has to be re-checked against a new ground. Sunrise
 *   would give a yellow page; Dark Cherry a red one. A picker that can make the
 *   app unreadable is not a picker.
 * - **Status colours never follow the palette.** Success, warning, error and
 *   info mean something. If choosing Forest turned errors green, the colour
 *   would stop carrying information - and someone would eventually miss a
 *   failure because it looked like a success.
 * - **Chart colours never follow the palette.** The categorical series were
 *   stepped and checked for colour-vision deficiency as a *set*. Re-deriving
 *   them per palette would silently discard that check twelve times over.
 *
 * ## Why five is nevertheless enough to repaint the app
 *
 * `globals.css` already declares `--ring`, `--sidebar-primary`,
 * `--sidebar-primary-foreground` and `--sidebar-ring` in terms of `var(--primary)`
 * and `var(--on-primary)`. Custom properties resolve per element, so overriding
 * `--primary` on the root element re-resolves every one of those in the same
 * pass. That indirection was written for light and dark mode; the palettes get
 * it for free.
 *
 * ## How a swatch becomes a token
 *
 * The six swatches run darkest to lightest. Light mode takes its accent from the
 * dark end and dark mode from the light end, which is exactly what the
 * hand-authored Default theme already does - deriving `default` with these rules
 * lands within a couple of steps of the values in `globals.css`, and that
 * correspondence is what the rules were checked against.
 *
 * Every result is then pushed through `adjustForContrast`, because a swatch
 * chosen for a mood board carries no promise of being legible. A colour that
 * already passes comes back untouched.
 */
export function derivePaletteTokens(
	palette: ThemePalette,
	mode: ThemeMode,
): PaletteTokens {
	const swatches = palette.swatches;
	const surface = mode === "dark" ? DARK_SURFACE : LIGHT_SURFACE;

	// `--primary` is used as a fill *and* as text (`text-primary`), so it is held
	// to the text floor rather than a laxer non-text one.
	const primary = adjustForContrast(
		mode === "dark" ? pickDarkAccent(swatches) : swatches[1],
		surface,
		MIN_TEXT_CONTRAST,
	);

	// The container is a block fill that always carries its own label, so the
	// constraint on it is that a label can be read *on* it - not that it stands
	// out from the page. That distinction is not a shortcut: the app's own dark
	// container, #00429c on #1a1c1c, measures 1.84:1 against the page and is a
	// deliberate, working part of the design. Requiring 3:1 there would have
	// rejected the very theme these rules are modelled on.
	//
	// The correction moves the container rather than the ink, because the ink is
	// already at the end of its range - there is nothing lighter than white to
	// reach for when a mid-tone fill will not host it.
	const containerBase = mode === "dark" ? swatches[1] : swatches[2];
	const primaryContainer = adjustForContrast(
		containerBase,
		readableInkOn(containerBase),
		MIN_TEXT_CONTRAST,
	);

	// The palette's lightest step is the label, when the container can carry it -
	// a tinted label keeps the theme's character where a flat white one would
	// not. When it cannot, plain ink is the answer: this is the one place where
	// legibility and character genuinely conflict, and legibility wins.
	const tintedInk = adjustForContrast(
		swatches[5],
		primaryContainer,
		MIN_TEXT_CONTRAST,
	);
	const onPrimaryContainer =
		contrastRatio(tintedInk, primaryContainer) >= MIN_TEXT_CONTRAST
			? tintedInk
			: readableInkOn(primaryContainer);

	const gradient = deriveGradient(swatches, mode);

	return {
		"--primary": primary,
		"--on-primary": readableInkOn(primary),
		"--primary-container": primaryContainer,
		"--on-primary-container": onPrimaryContainer,
		"--gradient-from": gradient.from,
		"--gradient-to": gradient.to,
		"--on-gradient": gradient.ink,
		// The tint is a wash used behind translucent surfaces rather than a
		// foreground, so it takes a mid step and needs no contrast floor of its
		// own - whatever sits on top is measured against the surface it lands on.
		// In dark mode it follows the accent, which is what the hand-authored
		// theme does: --surface-tint and --primary are both #b0c6ff there.
		"--surface-tint": mode === "dark" ? primary : swatches[3],
	};
}
