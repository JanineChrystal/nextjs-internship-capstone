import { Check } from "lucide-react";
import { DEFAULT_PALETTE_ID, THEME_PALETTES } from "@/lib/theme/palettes";
import type { ThemePalette } from "@/lib/types/theme";
import { cn } from "@/lib/utils";

/**
 * One palette, drawn as its six swatches.
 *
 * Rendered as a plain `<figure>`, not a button. Every palette but the current
 * one is inert right now - switching themes is Phase 7 - and a control that
 * looks pressable but does nothing is worse than one that never claimed it
 * would. It becomes a `<button>` in the same shape when the picker is wired.
 *
 * This lives in the global components folder rather than beside the settings
 * page because two screens now show it: the Appearance section in Settings and
 * the palette drawer on the landing page. Those are exactly the circumstances
 * where a component must not live inside one of its consumers - the second
 * screen would otherwise import a component out of the first one's private
 * folder, and the two copies would drift the moment Phase 7 makes them
 * clickable.
 */
function PaletteCard({
	palette,
	isCurrent,
	compact,
}: {
	palette: ThemePalette;
	isCurrent: boolean;
	compact?: boolean;
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
			<div
				className={cn(
					"flex overflow-hidden rounded-lg",
					compact ? "h-8" : "h-14",
				)}
				aria-hidden="true"
			>
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

interface PaletteGridProps {
	/** Columns differ per surface: a settings page is wide, a drawer is not. */
	className?: string;
	/** Shorter swatch strips, for the narrow drawer. */
	compact?: boolean;
}

export function PaletteGrid({ className, compact }: PaletteGridProps) {
	return (
		<div className={cn("grid gap-4", className)}>
			{THEME_PALETTES.map((palette) => (
				<PaletteCard
					key={palette.id}
					palette={palette}
					isCurrent={palette.id === DEFAULT_PALETTE_ID}
					compact={compact}
				/>
			))}
		</div>
	);
}
