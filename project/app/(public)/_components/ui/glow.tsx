import { cn } from "@/lib/utils";

/**
 * glow effect - a purely decorative radial gradient built from theme
 * tokens to ensure automatic color mode switching without interfering
 * with clicks.
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
				className="absolute left-1/2 top-0 h-144 w-5xl -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
				style={{
					background: `radial-gradient(closest-side, color-mix(in oklch, var(--primary) ${opacity * 100}%, transparent), transparent)`,
				}}
			/>
		</div>
	);
}

/**
 * horizon arc - an SVG-free scalable horizon effect using a shadowed div
 * and border radius that automatically adapts to the current theme.
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
				className="mx-auto h-120 w-[120%] max-w-none translate-y-1/2 rounded-[50%] border-t"
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
