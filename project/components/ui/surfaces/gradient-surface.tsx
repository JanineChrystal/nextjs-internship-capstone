import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

/**
 * The glassmorphic panel from the reference sheet.
 *
 * ## The restraint rule
 *
 * A gradient is an accent, and an accent that appears everywhere is a
 * background. This component exists so that decision is made once, in one file,
 * rather than by whoever adds the next card. It is for surfaces that are the
 * single most important thing on their screen:
 *
 * - empty states, which are asking for an action
 * - onboarding and invitation panels
 * - a marketing or hero block on a public page
 *
 * It is deliberately **not** for project cards, task cards, list rows, table
 * rows, stat tiles, toasts or dialogs. Those are things a reader scans dozens of
 * at a time, and a gradient on each is twelve palettes' worth of noise.
 *
 * ## How the colours reach it
 *
 * Everything is `var(--gradient-*)`, which the palette picker rewrites per
 * theme. Nothing here is a hex value, so a Sunrise workspace gets an amber
 * panel and an Ocean one gets a blue panel with no branching - and dark mode is
 * a different derivation of the same rule rather than a second stylesheet.
 *
 * `--on-gradient` is not simply white. It is chosen against the *worst* point of
 * the ramp, because a gradient that clears 4.5:1 at both ends can still pass
 * through an unreadable mid-tone in the middle, which is exactly where a heading
 * sits.
 */
interface GradientSurfaceProps {
	/** Drawn inside the circular orb, matching the reference's sparkle glyph. */
	icon?: LucideIcon;
	title: string;
	description?: string;
	/** A call to action. The reference puts a full-width pill button here. */
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
			 * The soft bloom the reference has bleeding through its blurred surface.
			 *
			 * A radial highlight rather than a `backdrop-filter: blur()`. The
			 * reference blurs a busy photograph behind glass; there is no photograph
			 * here, so a real blur would have nothing to work on and would cost a
			 * compositing layer on every card for no visible result. Two soft
			 * highlights over the ramp give the same impression of depth and paint
			 * essentially free.
			 *
			 * `aria-hidden` and behind everything via the parent's `isolate`: it is
			 * texture, and a screen reader has nothing to say about it.
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
					// Held at 65 characters or so. A centred paragraph running the full
					// width of a wide panel is the hardest thing on a page to read.
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
