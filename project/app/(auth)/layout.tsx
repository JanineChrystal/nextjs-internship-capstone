import type { ReactNode } from "react";
import { GlowingWave } from "@/components/ui/backgrounds/glowing-wave";
import { Toaster } from "@/components/ui/toaster";

/**
 * The shell both auth pages share.
 *
 * The route group had no layout at all before this, so each page repeated its
 * own full-screen centring wrapper and neither had a `Toaster` - meaning any
 * toast raised from a sign-in or sign-up screen was dispatched into a portal
 * that was never rendered. The dashboard and public groups each mount one; this
 * group was the gap.
 *
 * ## The stacking bug this layout had, because it is easy to repeat
 *
 * The wave was first given `-z-10` while this wrapper kept `bg-background`, and
 * it rendered nothing at all. A negative z-index does not put a child behind its
 * own parent's background - it puts it behind everything in the nearest
 * stacking context, and since `relative` with no `z-index` creates none, that
 * context was the root element. The wave was painting under the page's
 * background colour, one step too early in the paint order.
 *
 * The fix is to stop using a negative index: the wave sits at `z-0` and the
 * content is lifted to `z-10` above it, so both are ordinary positioned
 * siblings in the same context and the order is explicit.
 *
 * `fixed` rather than `absolute` so it fills the viewport even when the form
 * grows past it - Clerk's sign-up form is considerably taller than sign-in once
 * the OAuth buttons and every field are showing, and an absolutely positioned
 * background would stretch with the content and drag the wave's geometry with
 * it.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="relative min-h-screen bg-background">
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
			>
				<GlowingWave />
				{/* Softens the top and bottom so the wave reads as light coming from
				    below the horizon rather than as a band floating in the middle.
				    Deliberately partial alphas - at full opacity this washed the wave
				    out entirely, which is the other half of why nothing was visible. */}
				<div className="absolute inset-0 bg-linear-to-b from-background/85 via-transparent to-background/60" />
			</div>

			<main className="relative z-10 flex min-h-screen items-center justify-center px-margin-mobile py-12 sm:px-gutter">
				{children}
			</main>

			<Toaster />
		</div>
	);
}
