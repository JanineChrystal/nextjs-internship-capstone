import { cn } from "@/lib/utils";

/**
 * The soft radial light behind the hero and the closing call to action.
 *
 * Built from the theme's own `--primary` via `color-mix` rather than a
 * hard-coded colour, so it follows dark mode now and will follow the Phase 7
 * palette picker without an edit. That is the same indirection the rest of the
 * design system uses: nothing states a hex value except the token definitions.
 *
 * `aria-hidden` and `pointer-events-none` because it is decoration - it must
 * never be announced and must never intercept a click meant for the button
 * sitting on top of it.
 */
export function Glow({
	className,
	intensity = "medium",
}: {
	className?: string;
	intensity?: "soft" | "medium" | "strong";
}) {
	const opacity = { soft: 0.1, medium: 0.18, strong: 0.28 }[intensity];

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 overflow-hidden",
				className,
			)}
		>
			<div
				className="absolute left-1/2 top-0 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
				style={{
					background: `radial-gradient(closest-side, color-mix(in oklch, var(--primary) ${opacity * 100}%, transparent), transparent)`,
				}}
			/>
		</div>
	);
}

/**
 * The thin horizon arc from the reference layout - a bright rim above a dark
 * curve, as if a planet were rising.
 *
 * A single div with a very large border-radius and a top-edge box-shadow. The
 * alternative was an SVG or an image; a shadowed div costs no request, scales to
 * any width, and recolours with the theme for free.
 */
export function HorizonArc({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden",
				className,
			)}
		>
			<div
				className="mx-auto h-[30rem] w-[120%] max-w-none translate-y-1/2 rounded-[50%] border-t"
				style={{
					borderColor: "color-mix(in oklch, var(--primary) 55%, transparent)",
					boxShadow:
						"0 -2px 60px 0 color-mix(in oklch, var(--primary) 40%, transparent), inset 0 2px 40px 0 color-mix(in oklch, var(--primary) 22%, transparent)",
					background:
						"radial-gradient(120% 80% at 50% 100%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 70%)",
				}}
			/>
		</div>
	);
}
