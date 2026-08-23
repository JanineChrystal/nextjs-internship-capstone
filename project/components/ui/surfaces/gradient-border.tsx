import type React from "react";
import { cn } from "@/lib/utils";

interface GradientBorderProps {
	/** Adds the reference's outer bloom. For a focused composer, not at rest. */
	glow?: boolean;
	className?: string;
	children: React.ReactNode;
}

/**
 * A rounded surface whose *border* is the gradient, from the reference sheet.
 *
 * ## Why two backgrounds and not `border-image`
 *
 * `border-image` cannot follow `border-radius` - it squares the corners off, so
 * a rounded input ends up with a gradient rectangle behind rounded content. The
 * standard answer is two layered backgrounds: the inner one painted over the
 * padding box, the gradient over the border box, with `background-origin` and
 * `background-clip` deciding which occupies which. The border stays transparent
 * and the gradient shows through it, corners and all.
 *
 * ```text
 *   ┌───────────────────────┐  ← border-box: the gradient
 *   │ ╭───────────────────╮ │
 *   │ │  padding-box:     │ │  ← the card colour, painted on top
 *   │ │  the real surface │ │
 *   │ ╰───────────────────╯ │
 *   └───────────────────────┘
 * ```
 *
 * ## Restraint
 *
 * Same rule as `GradientSurface`: this marks the one input on a screen that is
 * the point of the screen - the comment composer, a primary search field. It is
 * not for every text input in a form, where a row of glowing borders makes it
 * impossible to tell which field is focused.
 *
 * The colours are `var(--gradient-*)`, so this follows the palette and the mode
 * without a single hex value here.
 */
export function GradientBorder({
	glow,
	className,
	children,
}: GradientBorderProps) {
	return (
		<div
			className={cn(
				"rounded-xl border-2 border-transparent transition-shadow",
				glow &&
					"shadow-[0_0_0_4px_color-mix(in_srgb,var(--gradient-to)_18%,transparent)]",
				className,
			)}
			style={{
				backgroundImage:
					"linear-gradient(var(--card), var(--card)), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
				backgroundOrigin: "border-box, border-box",
				// The first layer is clipped to the padding box so the border strip is
				// left showing the second. Swapping these two values is the usual way
				// this ends up as a gradient with no visible border at all.
				backgroundClip: "padding-box, border-box",
			}}
		>
			{children}
		</div>
	);
}
