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
