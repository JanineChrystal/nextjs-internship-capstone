/**
 * A named colour theme, as six swatches running dark to light.
 *
 * The tuple is fixed at exactly six on purpose. Every palette feeding the same
 * number of steps is what will let Phase 7 derive the app's ~45 design tokens
 * from them by one shared rule instead of hand-authoring each theme - and a
 * palette that arrived with four swatches would either break that rule or
 * silently get three tokens pointing at the same colour.
 */
export interface ThemePalette {
	id: string;
	name: string;
	swatches: readonly [string, string, string, string, string, string];
}

/**
 * Light or dark, which a palette derives differently.
 *
 * The same six swatches produce different tokens per mode - light mode takes its
 * accent from the dark end of the ramp and dark mode from the light end - so
 * every derivation has to be told which one it is deriving for.
 */
export type ThemeMode = "light" | "dark";

/**
 * The custom properties a palette overrides, as a CSS-property-name map.
 *
 * Keyed by the literal token names rather than by camel-case identifiers so the
 * applier can pass a key straight to `setProperty` with no translation step -
 * one that would be another place for `--on-primary` to be mistyped as
 * `--onPrimary` and fail silently, because setting an unknown custom property
 * is not an error.
 */
export interface PaletteTokens {
	"--primary": string;
	"--on-primary": string;
	"--primary-container": string;
	"--on-primary-container": string;
	"--surface-tint": string;
	/** The two ends of a gradient surface, and the ink that stays legible across it. */
	"--gradient-from": string;
	"--gradient-to": string;
	"--on-gradient": string;
}
