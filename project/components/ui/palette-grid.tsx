"use client";

import { Check } from "lucide-react";
import { usePalette } from "@/hooks/use-palette";
import type { ThemePalette } from "@/lib/types/theme";
import { cn } from "@/lib/utils";

/**
 * One palette, drawn as its six swatches, as a control that applies it.
 *
 * It was a `<figure>` until the picker was wired - every palette but the current
 * one was inert, and a control that looks pressable but does nothing is worse
 * than one that never claimed it would. It is now the `<button>` that comment
 * promised, in the same shape.
 *
 * `aria-pressed` rather than `aria-current`: this is a set of mutually exclusive
 * settings being switched on, not a set of places to navigate to. A screen
 * reader then announces "Ocean, pressed", which is the whole state of the
 * control in three words.
 *
 * This lives in the global components folder rather than beside the settings
 * page because two screens show it: the Appearance section in Settings and the
 * palette drawer on the landing page. Those are exactly the circumstances where
 * a component must not live inside one of its consumers - the second screen
 * would otherwise import out of the first one's private folder, and the two
 * would drift the moment one of them gained a behaviour.
 */
function PaletteCard({
	palette,
	isCurrent,
	compact,
	onSelect,
}: {
	palette: ThemePalette;
	isCurrent: boolean;
	compact?: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={isCurrent}
			className={cn(
				"rounded-xl border p-3 flex flex-col gap-3 text-left transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isCurrent
					? "border-primary bg-primary/5"
					: "border-border bg-surface-container-low hover:border-outline hover:bg-surface-container",
			)}
		>
			{/* aria-hidden because the swatch strip is decoration - the palette's
			    name in the caption below is what actually identifies it, and reading
			    out six colour rectangles would tell a screen-reader user nothing. */}
			<span
				className={cn(
					"flex overflow-hidden rounded-lg",
					compact ? "h-8" : "h-14",
				)}
				aria-hidden="true"
			>
				{palette.swatches.map((hex) => (
					<span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
				))}
			</span>

			<span className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-on-surface truncate">
					{palette.name}
				</span>
				{isCurrent && (
					<span className="flex items-center gap-1 text-xs text-primary shrink-0">
						<Check className="h-3.5 w-3.5" aria-hidden="true" />
						Current
					</span>
				)}
			</span>
		</button>
	);
}

interface PaletteGridProps {
	/** Columns differ per surface: a settings page is wide, a drawer is not. */
	className?: string;
	/** Shorter swatch strips, for the narrow drawer. */
	compact?: boolean;
}

export function PaletteGrid({ className, compact }: PaletteGridProps) {
	const { palettes, paletteId, isHydrated, selectPalette } = usePalette();

	return (
		<div className={cn("grid gap-4", className)}>
			{palettes.map((palette) => (
				<PaletteCard
					key={palette.id}
					palette={palette}
					// Nothing is marked current until the stored choice has been read.
					// Marking Default for one frame and then correcting it reads as the
					// app forgetting the setting and then remembering it.
					isCurrent={isHydrated && palette.id === paletteId}
					compact={compact}
					onSelect={() => selectPalette(palette.id)}
				/>
			))}
		</div>
	);
}
