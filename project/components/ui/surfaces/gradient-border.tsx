import type React from "react";
import { cn } from "@/lib/utils";

interface GradientBorderProps {
	/** glow effect - adds a diffuse outer bloom for active states like a focused input. */
	glow?: boolean;
	className?: string;
	children: React.ReactNode;
}

/**
 * gradient border - creates a rounded gradient border using layered backgrounds
 * (padding-box over border-box) to circumvent `border-image`'s inability to
 * curve corners. Reserved for primary screen inputs (like composers) and driven
 * entirely by CSS palette variables.
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
				/** background clipping - clips the solid color to the padding box, exposing the gradient underneath only in the border area. */
				backgroundClip: "padding-box, border-box",
			}}
		>
			{children}
		</div>
	);
}
