import Link from "next/link";
import type * as React from "react";
import type { RecoveryRoute } from "@/lib/types/error-page";
import { cn } from "@/lib/utils";

/** route line styles - shared utility classes ensuring links and action buttons look visually identical. */
const ROUTE_LINE = cn(
	"group flex w-full items-baseline gap-3 rounded-sm px-2 py-1.5 text-left transition-colors",
	"hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

/** animated marker - renders an icon prefix that physically nudges on hover to confirm interactivity. */
function Marker({ glyph }: { glyph: string }) {
	return (
		<span
			aria-hidden="true"
			className="text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
		>
			{glyph}
		</span>
	);
}

/**
 * terminal route - presents a recovery navigation link styled as a terminal
 * command. Displays the raw URL path as the primary label to reinforce the
 * theme, supplemented by a human-readable hint.
 */
export function TerminalRoute({ href, label, hint }: RecoveryRoute) {
	return (
		<Link href={href} className={ROUTE_LINE}>
			<Marker glyph="→" />
			<span className="shrink-0 text-on-surface underline-offset-4 group-hover:underline">
				{label}
			</span>
			<span className="min-w-0 truncate text-xs text-on-surface-variant">
				{hint}
			</span>
		</Link>
	);
}

/**
 * terminal action - provides a button-based recovery option for function
 * callbacks (like error boundary retries). Intentionally omits 'use client'
 * so importing files dictate its render context, keeping static error pages
 * fully server-rendered.
 */
export function TerminalAction({
	glyph = "↺",
	label,
	hint,
	...props
}: React.ComponentProps<"button"> & {
	glyph?: string;
	label: string;
	hint: string;
}) {
	return (
		<button type="button" className={ROUTE_LINE} {...props}>
			<Marker glyph={glyph} />
			<span className="shrink-0 text-on-surface underline-offset-4 group-hover:underline">
				{label}
			</span>
			<span className="min-w-0 truncate text-xs text-on-surface-variant">
				{hint}
			</span>
		</button>
	);
}
