import { PaletteGrid } from "@/components/ui/palette-grid";
import { SettingsSection } from "./settings-section";

/**
 * The theme palettes, shown but not yet selectable.
 *
 * Phase 5 ships the twelve palettes as reviewable data; Phase 7 adds the
 * generator that turns each one into the app's full token set for light and
 * dark, plus the picker that applies it. Splitting it this way means the colours
 * can be argued about now, while changing one is a one-line edit rather than a
 * regeneration of a thousand derived values.
 *
 * The grid itself moved to components/ui/palette-grid.tsx when the landing
 * page's palette drawer needed the same thing - two consumers, so it can no
 * longer live inside one of them.
 */
export function AppearanceSection() {
	return (
		<SettingsSection
			id="settings-appearance"
			title="Appearance"
			description="The colour themes being prepared for the app. Light and dark mode already work from the toggle in the top bar."
		>
			<p className="text-sm text-secondary rounded-lg border border-dashed border-border bg-surface-container-low p-3">
				Choosing a theme is not wired up yet. These twelve palettes are the
				colours the picker will offer, shown here so they can be reviewed before
				the switching logic is built.
			</p>

			<PaletteGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
		</SettingsSection>
	);
}
