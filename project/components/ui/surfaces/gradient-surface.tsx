import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

/**
 * gradient surface - provides a high-emphasis glassmorphic panel meant
 * exclusively for primary screen content (e.g., empty states, hero blocks).
 * Dynamically resolves `--gradient-*` CSS variables to adapt to the active
 * palette and uses `--on-gradient` to ensure text legibility across all tints.
 */
interface GradientSurfaceProps {
	/** icon - rendered within the top circular orb, replacing the reference's default sparkle. */
	icon?: LucideIcon;
	title: string;
	description?: string;
	/** action node - the primary CTA slot, placed below the content. */
	action?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
}

export function GradientSurface({
	icon: Icon,
	title,
	description,
	action,
	className,
	children,
}: GradientSurfaceProps) {
	return (
		<div
			className={cn(
				"relative isolate overflow-hidden rounded-2xl border border-white/10",
				"flex flex-col items-center gap-4 p-8 text-center sm:p-10",
				className,
			)}
			style={{
				backgroundImage:
					"linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
				color: "var(--on-gradient)",
			}}
		>
			{/*
			  * simulated glassmorphic bloom - mimics a blurred backdrop by layering
			  * two soft radial gradients over the surface. Avoids expensive CSS filters
			  * since there is no underlying image to blur, rendering faster for the same effect.
			  */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 opacity-70"
				style={{
					backgroundImage:
						"radial-gradient(60% 55% at 22% 12%, rgb(255 255 255 / 0.28), transparent 70%), radial-gradient(45% 45% at 88% 95%, rgb(255 255 255 / 0.14), transparent 70%)",
				}}
			/>

			{Icon && (
				<span
					className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/15 shadow-sm"
					aria-hidden="true"
				>
					<Icon className="size-6" />
				</span>
			)}

			<div className="flex flex-col gap-2">
				<h3 className="text-lg font-semibold tracking-tight text-balance sm:text-xl">
					{title}
				</h3>
				{description && (
					/** constrain line length - restricts the description's width to preserve readability of centered text. */
					<p className="max-w-prose text-sm/relaxed opacity-90">
						{description}
					</p>
				)}
			</div>

			{children}

			{action && <div className="mt-2 w-full max-w-xs">{action}</div>}
		</div>
	);
}
