import { Check } from "lucide-react";
import { DEFAULT_PALETTE_ID, THEME_PALETTES } from "@/lib/theme/palettes";
import type { ThemePalette } from "@/lib/types/theme";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./settings-section";

/**
 * One palette, drawn as its six swatches.
 *
 * Rendered as a plain `<figure>`, not a button. Every palette but the current
 * one is inert right now - switching themes is Phase 7 - and a control that
 * looks pressable but does nothing is worse than one that never claimed it
 * would. It becomes a `<button>` in the same shape when the picker is wired.
 */
function PaletteCard({
	palette,
	isCurrent,
}: {
	palette: ThemePalette;
	isCurrent: boolean;
}) {
	return (
		<figure
			className={cn(
				"rounded-xl border p-3 flex flex-col gap-3 transition-colors",
				isCurrent
					? "border-primary bg-primary/5"
					: "border-border bg-surface-container-low",
			)}
		>
			{/* aria-hidden because the swatch strip is decoration - the palette's
			    name in the caption below is what actually identifies it, and reading
			    out six colour rectangles would tell a screen-reader user nothing. */}
			<div className="flex h-14 overflow-hidden rounded-lg" aria-hidden="true">
				{palette.swatches.map((hex) => (
					<span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
				))}
			</div>

			<figcaption className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-on-surface truncate">
					{palette.name}
				</span>
				{isCurrent && (
					<span className="flex items-center gap-1 text-xs text-primary shrink-0">
						<Check className="h-3.5 w-3.5" aria-hidden="true" />
						Current
					</span>
				)}
			</figcaption>
		</figure>
	);
}

/**
 * The theme palettes, shown but not yet selectable.
 *
 * Phase 5 ships the twelve palettes as reviewable data; Phase 7 adds the
 * generator that turns each one into the app's full token set for light and
 * dark, plus the picker that applies it. Splitting it this way means the colours
 * can be argued about now, while changing one is a one-line edit rather than a
 * regeneration of a thousand derived values.
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

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{THEME_PALETTES.map((palette) => (
					<PaletteCard
						key={palette.id}
						palette={palette}
						isCurrent={palette.id === DEFAULT_PALETTE_ID}
					/>
				))}
			</div>
		</SettingsSection>
	);
}
