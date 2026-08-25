import type { ReactNode } from "react";
import { GlowingWave } from "@/components/ui/backgrounds/glowing-wave";
import { Toaster } from "@/components/ui/toaster";

/**
 * auth layout - provides a shared shell with a background wave and Toaster
 * for auth pages, resolving previous z-index stacking bugs by using
 * explicit z-indexes without negative values.
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
