/**
 * The colour maths the palette picker needs.
 *
 * Pure functions over hex strings, with no DOM and no React, so the rules that
 * decide whether a colour is legible can be tested directly rather than
 * inferred from a screenshot. Everything here follows the WCAG 2.1 definitions
 * of relative luminance and contrast ratio.
 *
 * ## Why this file has to exist at all
 *
 * A palette is six hand-picked swatches. Nothing about being chosen for a mood
 * board makes a colour usable as body text - Sunrise's darkest swatch measures
 * about 2.9:1 against the light page, which is below the 4.5:1 floor and would
 * make every `text-primary` label in the app hard to read. The picker therefore
 * cannot simply assign a swatch to a token. It has to be able to *move* a colour
 * until it is legible, and that is what `adjustForContrast` does.
 */

/** WCAG AA for normal-size text. Also what this app uses for icon-sized marks. */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * The two inks a derived colour can carry, matching globals.css.
 *
 * Exported because the gradient derivation picks between them too, and a second
 * copy of `#1a1c1c` in another file is one that would not be updated when the
 * design system's dark ink changes.
 */
export const LIGHT_INK = "#ffffff";
export const DARK_INK = "#1a1c1c";

type Rgb = readonly [number, number, number];
type Hsl = readonly [number, number, number];

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Parses `#rgb` or `#rrggbb`.
 *
 * Throws rather than returning a fallback. Every colour reaching this comes from
 * `lib/theme/palettes.ts`, which is our own checked-in data, so a malformed
 * value is a typo in that file and not a runtime condition to be survived - and
 * a silent grey fallback would hide the typo until someone noticed one palette
 * looked wrong. A test walks all twelve palettes so the throw can never reach a
 * browser.
 */
export function hexToRgb(hex: string): Rgb {
	if (!HEX_PATTERN.test(hex)) {
		throw new Error(`Not a hex colour: ${hex}`);
	}

	const body = hex.slice(1);
	const full =
		body.length === 3
			? body
					.split("")
					.map((char) => char + char)
					.join("")
			: body;

	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

export function rgbToHex([r, g, b]: Rgb): string {
	const channel = (value: number) =>
		Math.round(Math.min(255, Math.max(0, value)))
			.toString(16)
			.padStart(2, "0");

	return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Undoes the sRGB transfer function for one channel.
 *
 * Screens do not emit light in proportion to the number in the file - the value
 * is gamma-encoded. Averaging the raw bytes would say that mid-grey is half as
 * bright as white, which is not what an eye sees, and every contrast decision
 * built on it would be wrong.
 */
function channelToLinear(value: number): number {
	const scaled = value / 255;
	return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance: 0 for black, 1 for white. */
export function relativeLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex);
	// The three weights are not equal because the eye is far more sensitive to
	// green than to blue. A blue and a green of the same numeric value are not
	// equally bright, and treating them as such is the usual reason a "checked"
	// palette still fails on a real screen.
	return (
		0.2126 * channelToLinear(r) +
		0.7152 * channelToLinear(g) +
		0.0722 * channelToLinear(b)
	);
}

/** WCAG contrast ratio, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
	const first = relativeLuminance(a);
	const second = relativeLuminance(b);
	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);

	return (lighter + 0.05) / (darker + 0.05);
}

/** Whichever of the two inks reads better on `background`. */
export function readableInkOn(background: string): string {
	return contrastRatio(background, DARK_INK) >=
		contrastRatio(background, LIGHT_INK)
		? DARK_INK
		: LIGHT_INK;
}

/**
 * How much colour a swatch carries, from 0 (a pure grey) to 1 (fully saturated).
 *
 * Deliberately not HSL saturation, which is misleading at the pale end: a barely
 * tinted cream like `#fdfbd5` scores over 0.9 there, because HSL measures
 * saturation relative to how much room is left at that lightness. Chroma is the
 * plain spread between the strongest and weakest channel, so it answers the
 * question actually being asked - would a reader call this a colour, or would
 * they call it off-white?
 */
export function chroma(hex: string): number {
	const [r, g, b] = hexToRgb(hex);
	return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

function rgbToHsl([r, g, b]: Rgb): Hsl {
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;

	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const lightness = (max + min) / 2;
	const delta = max - min;

	if (delta === 0) return [0, 0, lightness];

	const saturation =
		lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

	let hue: number;
	if (max === red) hue = ((green - blue) / delta) % 6;
	else if (max === green) hue = (blue - red) / delta + 2;
	else hue = (red - green) / delta + 4;

	hue *= 60;
	if (hue < 0) hue += 360;

	return [hue, saturation, lightness];
}

function hslToRgb([h, s, l]: Hsl): Rgb {
	if (s === 0) {
		const grey = l * 255;
		return [grey, grey, grey];
	}

	// Named `hslChroma` rather than the algorithm's usual `chroma` so it does not
	// shadow this module's exported `chroma`, which measures something related but
	// different - that one is the plain channel spread, this one is scaled by
	// lightness as HSL defines it.
	const hslChroma = (1 - Math.abs(2 * l - 1)) * s;
	const secondary = hslChroma * (1 - Math.abs(((h / 60) % 2) - 1));
	const match = l - hslChroma / 2;

	const sector = Math.floor(h / 60) % 6;
	const [r, g, b] = (
		[
			[hslChroma, secondary, 0],
			[secondary, hslChroma, 0],
			[0, hslChroma, secondary],
			[0, secondary, hslChroma],
			[secondary, 0, hslChroma],
			[hslChroma, 0, secondary],
		] as const
	)[sector];

	return [(r + match) * 255, (g + match) * 255, (b + match) * 255];
}

/** A colour's HSL lightness, 0 to 1. */
export function lightnessOf(hex: string): number {
	return rgbToHsl(hexToRgb(hex))[2];
}

/** The same colour at a different lightness, hue and saturation kept. */
export function withLightness(hex: string, lightness: number): string {
	const [hue, saturation] = rgbToHsl(hexToRgb(hex));
	return rgbToHex(
		hslToRgb([hue, saturation, Math.min(1, Math.max(0, lightness))]),
	);
}

/** Moves a colour up or down its lightness axis by `delta`. */
export function shiftLightness(hex: string, delta: number): string {
	return withLightness(hex, lightnessOf(hex) + delta);
}

/**
 * A colour `t` of the way from `from` to `to`.
 *
 * Interpolated in plain sRGB because that is what a CSS `linear-gradient`
 * without an explicit colour space does. Mixing in a perceptual space here would
 * be a nicer ramp and would describe a gradient the browser is not drawing - so
 * the contrast measured from it would be measured from the wrong colours.
 */
export function mixColors(from: string, to: string, t: number): string {
	const a = hexToRgb(from);
	const b = hexToRgb(to);
	return rgbToHex([
		a[0] + (b[0] - a[0]) * t,
		a[1] + (b[1] - a[1]) * t,
		a[2] + (b[2] - a[2]) * t,
	]);
}

/** Where along a gradient the contrast is sampled. */
const RAMP_SAMPLES = [0, 0.25, 0.5, 0.75, 1];

/**
 * The contrast of `ink` against the *worst* point of a gradient.
 *
 * ## Why the endpoints are not enough
 *
 * A gradient from a dark blue to a light amber can clear 4.5:1 at both ends and
 * pass through a mid-tone in the middle where white text measures 2:1 and black
 * text measures 2.5:1 - neither works, and that band is usually right where the
 * label sits. Checking only the two ends is the standard way a gradient button
 * ships unreadable across its middle third, and it is invisible in review
 * because both the colours you *chose* are fine.
 *
 * Five samples rather than two: enough to catch a mid-ramp dip, cheap enough to
 * run for twelve palettes in both modes inside a test.
 */
export function worstRampContrast(
	from: string,
	to: string,
	ink: string,
): number {
	return Math.min(
		...RAMP_SAMPLES.map((t) => contrastRatio(ink, mixColors(from, to, t))),
	);
}

/**
 * Moves a colour along its own lightness axis until it is legible on
 * `background`, and no further.
 *
 * ## Why lightness, and only lightness
 *
 * Hue and saturation are what make Sunrise recognisably Sunrise. Contrast is
 * almost entirely a function of lightness, so darkening a swatch buys legibility
 * at the smallest possible cost to identity - the result is still the same
 * colour, just deeper. Re-picking a different swatch would be simpler and would
 * throw away the palette's character; desaturating towards grey would be worse
 * still, because at that point every palette starts to look like every other.
 *
 * ## Why a binary search rather than a step loop
 *
 * The goal is the colour *closest to the original* that still passes, not merely
 * one that passes. Stepping lightness by a fixed amount overshoots by up to a
 * whole step and makes results depend on the step size. The search converges on
 * the boundary from both sides, so a swatch that already passes is returned
 * untouched and one that fails is moved by the least amount that fixes it.
 */
export function adjustForContrast(
	hex: string,
	background: string,
	minRatio: number,
): string {
	if (contrastRatio(hex, background) >= minRatio) return hex;

	const [hue, saturation, lightness] = rgbToHsl(hexToRgb(hex));

	// Which way to move: against a light page a colour has to get darker, and
	// against a dark page it has to get lighter. The extreme in that direction is
	// black or white, whichever gives the most contrast that is available.
	const extreme = relativeLuminance(background) > 0.5 ? 0 : 1;

	const ratioAt = (candidate: number) =>
		contrastRatio(rgbToHex(hslToRgb([hue, saturation, candidate])), background);

	// If even pure black or pure white cannot reach the target - possible against
	// a mid-tone background at a high ratio - return the best available rather
	// than a colour that fails by more.
	if (ratioAt(extreme) < minRatio) {
		return rgbToHex(hslToRgb([hue, saturation, extreme]));
	}

	let passing = extreme;
	let failing = lightness;

	// 20 halvings resolve lightness far finer than the 1/255 a hex channel can
	// express, so the loop is exact for this purpose and needs no epsilon.
	for (let step = 0; step < 20; step += 1) {
		const middle = (passing + failing) / 2;
		if (ratioAt(middle) >= minRatio) passing = middle;
		else failing = middle;
	}

	return rgbToHex(hslToRgb([hue, saturation, passing]));
}
