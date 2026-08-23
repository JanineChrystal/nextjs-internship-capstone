import Link from "next/link";
import type * as React from "react";
import type { RecoveryRoute } from "@/lib/types/error-page";
import { cn } from "@/lib/utils";

/**
 * Shared between the link and the button below, so a route and an action are
 * indistinguishable to the reader - both are just lines that respond.
 */
const ROUTE_LINE = cn(
	"group flex w-full items-baseline gap-3 rounded-sm px-2 py-1.5 text-left transition-colors",
	"hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

/** The `→` / `↺` marker. Nudges on hover so the line feels like it responds. */
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
 * One navigable line in the recovery block.
 *
 * The path is the link text rather than a friendly label because the screen is
 * pretending to be a terminal, and because someone who mistyped a URL is helped
 * by seeing what a correct one looks like. The human explanation rides alongside
 * it, so the line is still readable by someone who does not think in routes.
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
 * A recovery line that runs a handler instead of navigating - the retry offered
 * by an `error.tsx` boundary, which is a function call and not a URL.
 *
 * This file carries no `"use client"` directive on purpose. A component is only
 * a client component because of where it is imported from, and the only callers
 * that pass `onClick` are the error boundaries, which are already client files.
 * Keeping the directive off means `not-found.tsx`, `unauthorized.tsx` and
 * `forbidden.tsx` stay server-rendered and ship no JavaScript at all.
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
