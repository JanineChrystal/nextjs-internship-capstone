import { PaletteGrid } from "@/components/ui/palette-grid";
import { SettingsSection } from "./settings-section";

/**
 * The theme palettes, now selectable.
 *
 * Phase 5 shipped the twelve palettes as reviewable data so the colours could be
 * argued about while changing one was still a one-line edit. Phase 7 adds the
 * derivation that turns a palette into custom properties and the picker that
 * applies it.
 *
 * There is no state here. The grid reads and writes through `usePalette`, which
 * is also what the landing page's appearance drawer uses - so this section is
 * layout and copy only, and the two surfaces cannot disagree about which palette
 * is in force.
 */
export function AppearanceSection() {
	return (
		<SettingsSection
			id="settings-appearance"
			title="Appearance"
			description="Pick the colour theme the app uses. Light and dark mode work independently, from the toggle in the top bar."
		>
			<p className="text-sm text-secondary">
				A theme changes the app's accent colour - buttons, links, focus rings
				and the sidebar's current page. Page backgrounds stay neutral, and
				success, warning and error keep their own colours so they never stop
				meaning what they mean. Your choice is remembered in this browser.
			</p>

			<PaletteGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
		</SettingsSection>
	);
}
