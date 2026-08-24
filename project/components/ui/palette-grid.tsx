"use client";

import { Check } from "lucide-react";
import { usePalette } from "@/hooks/use-palette";
import type { ThemePalette } from "@/lib/types/theme";
import { cn } from "@/lib/utils";

/**
 * palette card - an interactive button rendering a palette's six swatches. Uses
 * `aria-pressed` to correctly announce state for mutually exclusive settings.
 * Resides globally to serve both the settings page and landing drawer without
 * cross-boundary imports.
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
			{/* hide decorative swatches - prevents screen readers from redundantly announcing the six color swatches since the title identifies the choice. */}
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
	/** grid styling - defines column layouts depending on the containing surface width. */
	className?: string;
	/** compact height - reduces swatch height for tighter spaces like the sidebar drawer. */
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
					/** hydrate safely - avoids flashing 'Default' before the actual stored preference is read. */
					isCurrent={isHydrated && palette.id === paletteId}
					compact={compact}
					onSelect={() => selectPalette(palette.id)}
				/>
			))}
		</div>
	);
}
