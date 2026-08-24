import { describe, expect, it } from "vitest";
import type { ThemeMode } from "@/lib/types/theme";
import {
	adjustForContrast,
	chroma,
	contrastRatio,
	hexToRgb,
	lightnessOf,
	MIN_TEXT_CONTRAST,
	mixColors,
	readableInkOn,
	relativeLuminance,
	rgbToHex,
	worstRampContrast,
} from "./color";
import {
	derivePaletteTokens,
	PALETTE_TOKEN_NAMES,
} from "./derive-palette-tokens";
import { DEFAULT_PALETTE_ID, THEME_PALETTES } from "./palettes";

const LIGHT_SURFACE = "#f9f9f9";
const DARK_SURFACE = "#1a1c1c";
const MODES: ThemeMode[] = ["light", "dark"];

describe("hexToRgb", () => {
	it("parses six-digit hex", () => {
		expect(hexToRgb("#003178")).toEqual([0, 49, 120]);
	});

	it("expands three-digit hex", () => {
		expect(hexToRgb("#abc")).toEqual(hexToRgb("#aabbcc"));
	});

	it("is case-insensitive", () => {
		expect(hexToRgb("#DF2531")).toEqual(hexToRgb("#df2531"));
	});

	it("throws on anything that is not a hex colour", () => {
		// Loud rather than falling back to grey: every value reaching this comes
		// from our own palette data, so a rejection is a typo in that file.
		expect(() => hexToRgb("003178")).toThrow();
		expect(() => hexToRgb("#12345")).toThrow();
		expect(() => hexToRgb("rebeccapurple")).toThrow();
	});
});

describe("rgbToHex", () => {
	it("round-trips through hexToRgb", () => {
		for (const hex of ["#000000", "#ffffff", "#2b5bb5", "#e9a413"]) {
			expect(rgbToHex(hexToRgb(hex))).toBe(hex);
		}
	});

	it("clamps out-of-range channels instead of wrapping", () => {
		expect(rgbToHex([-20, 300, 128])).toBe("#00ff80");
	});
});

describe("relativeLuminance", () => {
	it("anchors at the ends of the scale", () => {
		expect(relativeLuminance("#000000")).toBe(0);
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
	});

	it("weights green above red above blue", () => {
		// The eye is far more sensitive to green. A palette checked by averaging
		// raw channel values would get this backwards.
		const red = relativeLuminance("#ff0000");
		const green = relativeLuminance("#00ff00");
		const blue = relativeLuminance("#0000ff");

		expect(green).toBeGreaterThan(red);
		expect(red).toBeGreaterThan(blue);
	});
});

describe("contrastRatio", () => {
	it("returns 21 for black on white and 1 for a colour on itself", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
		expect(contrastRatio("#2b5bb5", "#2b5bb5")).toBeCloseTo(1, 5);
	});

	it("is symmetric", () => {
		expect(contrastRatio("#003178", "#f9f9f9")).toBeCloseTo(
			contrastRatio("#f9f9f9", "#003178"),
			10,
		);
	});
});

describe("readableInkOn", () => {
	it("picks light ink on a dark ground and dark ink on a light one", () => {
		expect(contrastRatio(readableInkOn("#003178"), "#003178")).toBeGreaterThan(
			MIN_TEXT_CONTRAST,
		);
		expect(contrastRatio(readableInkOn("#fdfead"), "#fdfead")).toBeGreaterThan(
			MIN_TEXT_CONTRAST,
		);
	});
});

describe("adjustForContrast", () => {
	it("leaves a colour that already passes untouched", () => {
		// #003178 is the app's own primary and measures about 13:1 on the light
		// page, so the picker must not "correct" it into something else.
		expect(adjustForContrast("#003178", LIGHT_SURFACE, MIN_TEXT_CONTRAST)).toBe(
			"#003178",
		);
	});

	it("darkens a colour that fails against a light ground", () => {
		// Sunrise's brand step measures about 2:1 on the light page - the exact
		// case that makes assigning a swatch straight to a token unusable.
		const before = contrastRatio("#e9a413", LIGHT_SURFACE);
		const after = adjustForContrast(
			"#e9a413",
			LIGHT_SURFACE,
			MIN_TEXT_CONTRAST,
		);

		expect(before).toBeLessThan(MIN_TEXT_CONTRAST);
		expect(contrastRatio(after, LIGHT_SURFACE)).toBeGreaterThanOrEqual(
			MIN_TEXT_CONTRAST,
		);
		expect(relativeLuminance(after)).toBeLessThan(relativeLuminance("#e9a413"));
	});

	it("lightens a colour that fails against a dark ground", () => {
		const after = adjustForContrast("#0d1f23", DARK_SURFACE, MIN_TEXT_CONTRAST);

		expect(contrastRatio(after, DARK_SURFACE)).toBeGreaterThanOrEqual(
			MIN_TEXT_CONTRAST,
		);
		expect(relativeLuminance(after)).toBeGreaterThan(
			relativeLuminance("#0d1f23"),
		);
	});

	it("moves the colour no further than it has to", () => {
		// The point of the binary search: land on the boundary, not past it. A
		// fixed-step loop would overshoot by up to a whole step and throw away
		// more of the palette's character than necessary.
		const adjusted = adjustForContrast(
			"#e9a413",
			LIGHT_SURFACE,
			MIN_TEXT_CONTRAST,
		);

		expect(contrastRatio(adjusted, LIGHT_SURFACE)).toBeLessThan(
			MIN_TEXT_CONTRAST + 0.5,
		);
	});

	it("keeps the hue family recognisable", () => {
		// Darkening an orange must not produce a brown-grey. Red should still
		// dominate blue by a wide margin afterwards.
		const [r, , b] = hexToRgb(
			adjustForContrast("#e9a413", LIGHT_SURFACE, MIN_TEXT_CONTRAST),
		);

		expect(r).toBeGreaterThan(b);
	});
});

describe("chroma", () => {
	it("scores a grey at zero and a pure hue at one", () => {
		expect(chroma("#808080")).toBe(0);
		expect(chroma("#ff0000")).toBe(1);
	});

	it("separates a pale tint from a light colour, where HSL saturation does not", () => {
		// The exact pair the dark-accent rule was calibrated on: Sunrise's lightest
		// step reads as cream, Default's reads as blue, and HSL saturation scores
		// the cream *higher* of the two.
		expect(chroma("#fdfbd5")).toBeLessThan(chroma("#b0c6ff"));
	});
});

describe("mixColors", () => {
	it("returns the endpoints at 0 and 1", () => {
		expect(mixColors("#000000", "#ffffff", 0)).toBe("#000000");
		expect(mixColors("#000000", "#ffffff", 1)).toBe("#ffffff");
	});

	it("interpolates in sRGB, matching what a CSS gradient draws", () => {
		// Not a perceptual midpoint - deliberately. Measuring contrast from a
		// nicer ramp than the browser paints would measure the wrong colours.
		expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
	});
});

describe("worstRampContrast", () => {
	it("catches a mid-ramp dip that both endpoints hide", () => {
		// The failure this whole rule exists for, as a real pair. Dark ink clears
		// 4.5:1 against BOTH ends of this ramp - 4.53 and 4.66 - and collapses to
		// 2.52 across the middle, which is where a button label sits. Anyone
		// checking the two colours they picked would call this palette fine.
		const from = "#009900";
		const to = "#ff0099";
		const ink = "#1a1c1c";

		expect(contrastRatio(ink, from)).toBeGreaterThan(MIN_TEXT_CONTRAST);
		expect(contrastRatio(ink, to)).toBeGreaterThan(MIN_TEXT_CONTRAST);
		expect(worstRampContrast(from, to, ink)).toBeLessThan(MIN_TEXT_CONTRAST);
	});

	it("is never kinder than the worse of the two endpoints", () => {
		expect(
			worstRampContrast("#003178", "#b0c6ff", "#ffffff"),
		).toBeLessThanOrEqual(
			Math.min(
				contrastRatio("#ffffff", "#003178"),
				contrastRatio("#ffffff", "#b0c6ff"),
			),
		);
	});

	it("equals the endpoint contrast when both ends are the same colour", () => {
		expect(worstRampContrast("#003178", "#003178", "#ffffff")).toBeCloseTo(
			contrastRatio("#ffffff", "#003178"),
			5,
		);
	});
});

describe("THEME_PALETTES", () => {
	it("holds exactly six parseable swatches per palette", () => {
		// This is what guarantees hexToRgb's throw can never reach a browser.
		for (const palette of THEME_PALETTES) {
			expect(palette.swatches).toHaveLength(6);
			for (const swatch of palette.swatches) {
				expect(() => hexToRgb(swatch)).not.toThrow();
			}
		}
	});

	it("has unique ids and includes the default", () => {
		const ids = THEME_PALETTES.map((palette) => palette.id);

		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain(DEFAULT_PALETTE_ID);
	});

	it("runs darkest to lightest", () => {
		// The derivation depends on this ordering: light mode takes its accent
		// from index 1 and dark mode from index 5. A palette listed the other way
		// round would produce a near-white primary on a white page.
		for (const palette of THEME_PALETTES) {
			const first = relativeLuminance(palette.swatches[0]);
			const last = relativeLuminance(palette.swatches[5]);

			expect(last).toBeGreaterThan(first);
		}
	});
});

describe("derivePaletteTokens", () => {
	it("produces legible tokens for every palette in both modes", () => {
		// The whole reason the derivation exists. Twelve palettes times two modes
		// is twenty-four token sets that no one is going to check by eye.
		for (const palette of THEME_PALETTES) {
			for (const mode of MODES) {
				const tokens = derivePaletteTokens(palette, mode);
				const surface = mode === "dark" ? DARK_SURFACE : LIGHT_SURFACE;

				expect(
					contrastRatio(tokens["--primary"], surface),
					`${palette.id} / ${mode}: primary on the page`,
				).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);

				expect(
					contrastRatio(tokens["--on-primary"], tokens["--primary"]),
					`${palette.id} / ${mode}: label on primary`,
				).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);

				// Deliberately no container-versus-page assertion. The app's own dark
				// container, #00429c on #1a1c1c, measures 1.84:1 and is a working part
				// of the design - a container is identified by the label it carries,
				// not by standing out from the page behind it. An earlier version of
				// this test required 3:1 there and failed Sunrise, which is what
				// surfaced the wrong rule.
				expect(
					contrastRatio(
						tokens["--on-primary-container"],
						tokens["--primary-container"],
					),
					`${palette.id} / ${mode}: label on container`,
				).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			}
		}
	});

	it("returns every token as a hex string", () => {
		const tokens = derivePaletteTokens(THEME_PALETTES[0], "light");

		// Kept in step with PALETTE_TOKEN_NAMES, which the applier iterates to
		// REMOVE the overrides when Default is chosen. If the two ever disagree,
		// picking Default would leave some of them applied.
		expect(Object.keys(tokens).sort()).toEqual([...PALETTE_TOKEN_NAMES].sort());
		for (const value of Object.values(tokens)) {
			expect(() => hexToRgb(value)).not.toThrow();
		}
	});

	it("derives the default palette close to the hand-authored tokens", () => {
		// Not applied at runtime - picking Default removes the overrides instead,
		// so the stylesheet's own values stand. This asserts the *rule* is right:
		// if the mapping from swatch index to token were wrong, deriving the one
		// palette whose intended output is already known would show it.
		const palette = THEME_PALETTES.find(
			(entry) => entry.id === DEFAULT_PALETTE_ID,
		);
		if (!palette) throw new Error("default palette missing");

		const light = derivePaletteTokens(palette, "light");
		expect(light["--primary"]).toBe("#003178");
		expect(light["--surface-tint"]).toBe("#2B5BB5");

		const dark = derivePaletteTokens(palette, "dark");
		expect(dark["--primary"]).toBe("#B0C6FF");
		expect(dark["--surface-tint"]).toBe("#B0C6FF");
	});

	it("does not hand a coloured palette a washed-out dark accent", () => {
		// Taking the lightest swatch literally gave Sunrise a cream accent, Berry a
		// near-white one, and Cloud Berry and Mocha the same - four themes that
		// were legible and indistinguishable from each other in dark mode.
		//
		// Cloud Berry, Forest and Dark Forest are exempt because they are
		// low-chroma all the way down: there is no coloured step to find, and
		// inventing one would misrepresent the palette.
		const lowChromaByDesign = new Set(["cloud-berry", "forest", "dark-forest"]);

		for (const palette of THEME_PALETTES) {
			if (lowChromaByDesign.has(palette.id)) continue;

			const dark = derivePaletteTokens(palette, "dark");
			expect(
				chroma(dark["--primary"]),
				`${palette.id}: dark accent has lost its colour`,
			).toBeGreaterThanOrEqual(0.2);
		}
	});

	it("keeps every gradient legible along its whole ramp", () => {
		// Twenty-four gradients, each sampled at five points. The endpoints alone
		// would pass for palettes that fail in the middle - see the
		// worstRampContrast suite above for what that looks like.
		for (const palette of THEME_PALETTES) {
			for (const mode of MODES) {
				const tokens = derivePaletteTokens(palette, mode);

				expect(
					worstRampContrast(
						tokens["--gradient-from"],
						tokens["--gradient-to"],
						tokens["--on-gradient"],
					),
					`${palette.id} / ${mode}: worst point of the gradient`,
				).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			}
		}
	});

	it("keeps the two ends of every gradient far enough apart to read as one", () => {
		// The low-chroma palettes are why this exists. Dark Forest is grey at
		// every step, so its ramp can only be told from a flat fill by lightness.
		for (const palette of THEME_PALETTES) {
			for (const mode of MODES) {
				const tokens = derivePaletteTokens(palette, mode);
				const separation = Math.abs(
					lightnessOf(tokens["--gradient-from"]) -
						lightnessOf(tokens["--gradient-to"]),
				);

				expect(
					separation,
					`${palette.id} / ${mode}: gradient ends are too close`,
				).toBeGreaterThan(0.1);
			}
		}
	});

	it("derives different accents for light and dark", () => {
		// Inline styles outrank the .dark block, so if both modes derived the same
		// value the palette would pin one mode's accent over the other's page.
		for (const palette of THEME_PALETTES) {
			const light = derivePaletteTokens(palette, "light");
			const dark = derivePaletteTokens(palette, "dark");

			expect(
				light["--primary"],
				`${palette.id}: light and dark primary must differ`,
			).not.toBe(dark["--primary"]);
		}
	});
});
