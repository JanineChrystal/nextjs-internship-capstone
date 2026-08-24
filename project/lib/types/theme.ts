/**
 * theme palette - defines a named color theme as exactly six swatches
 * from dark to light, ensuring a consistent rule for deriving design tokens.
 */
export interface ThemePalette {
	id: string;
	name: string;
	swatches: readonly [string, string, string, string, string, string];
}

/**
 * theme mode - distinguishes between light and dark contexts to correctly
 * map accent swatches during token derivation.
 */
export type ThemeMode = "light" | "dark";

/**
 * palette tokens - strictly typed map of CSS custom properties overridden by
 * a palette, using literal names to enable direct `setProperty` calls without
 * translation risk.
 */
export interface PaletteTokens {
	"--primary": string;
	"--on-primary": string;
	"--primary-container": string;
	"--on-primary-container": string;
	"--surface-tint": string;
	/** gradient bounds - the two ends of a gradient surface, and ink for legibility */
	"--gradient-from": string;
	"--gradient-to": string;
	"--on-gradient": string;
}
