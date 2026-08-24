import { PaletteGrid } from "@/components/ui/palette-grid";
import { SettingsSection } from "./settings-section";

/**
 * appearance section component - provides a stateless layout for the palette grid,
 * delegating all theme reading and writing to the shared usePalette hook to
 * guarantee consistency with other appearance controls.
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
