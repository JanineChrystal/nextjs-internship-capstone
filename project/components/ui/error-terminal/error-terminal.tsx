import type * as React from "react";
import {
	ASCII_NUMERALS,
	ERROR_SEVERITY,
	ERROR_STATUS_LABEL,
	NUMERAL_ROWS,
} from "@/lib/constants/error-pages";
import type { ErrorPageCode, RecoveryRoute } from "@/lib/types/error-page";
import { cn } from "@/lib/utils";
import { TerminalRoute } from "./terminal-routes";

/**
 * Severity decides one colour. Everything else on the screen stays neutral.
 *
 * `neutral` is `on-surface-variant` rather than `outline` because the numeral is
 * the largest thing on the page, and `outline` is tuned for hairlines - at
 * #546067 on the dark surface it drops to about 3:1, which is fine for a border
 * and far too faint for the element the eye lands on first.
 */
const SEVERITY_TONE = {
	neutral: "text-on-surface-variant",
	action: "text-primary",
	fault: "text-error",
} as const;

/**
 * Lays the code out as block glyphs, one printed row at a time.
 *
 * Built row-major rather than glyph-major because the digits sit side by side:
 * row 0 of every digit has to be emitted before row 1 of the first one, or the
 * numerals stack vertically instead of reading as a number.
 */
function buildNumeral(code: string): string[] {
	return Array.from({ length: NUMERAL_ROWS }, (_, row) =>
		code
			.split("")
			.map((digit) => ASCII_NUMERALS[digit]?.[row] ?? "     ")
			.join(" "),
	);
}

interface ErrorTerminalProps {
	code: ErrorPageCode;
	/** The one-line diagnosis, e.g. "Route not found". Becomes the page's h1. */
	title: string;
	/** Why it happened and what the reader can do, in plain language. */
	description: string;
	/** The routes offered as a way out. */
	routes: readonly RecoveryRoute[];
	/**
	 * Next's `error.digest` - the only handle on a server stack, which is
	 * stripped from the client in production. Printed so a report can quote it.
	 */
	reference?: string;
	/** Extra recovery lines that run a handler rather than navigate. */
	actions?: React.ReactNode;
	/** Applied to the centring wrapper, so a page can choose its own height. */
	className?: string;
}

/**
 * The shared error screen: 401, 403, 404 and 500 all render through this.
 *
 * ## Why one component instead of four pages
 *
 * The four codes previously lived as three hand-written pages plus nothing at
 * all for 404, and they had already drifted - two used colour tokens that no
 * longer exist, one centred at `60vh` and another at `24` units of padding, and
 * only one offered more than a single way out. Every future change to the error
 * experience would have had to be made four times and would have been made
 * three.
 *
 * ## Why it is not a client component
 *
 * There is no state and no handler here, and the caret blinks in CSS. That lets
 * `not-found.tsx`, `unauthorized.tsx` and `forbidden.tsx` stay server-rendered
 * and ship zero JavaScript. The error boundaries, which are client files by
 * necessity, pass their retry in through `actions` - so the one case that needs
 * interactivity pays for it, and the three that do not, do not.
 */
export function ErrorTerminal({
	code,
	title,
	description,
	routes,
	reference,
	actions,
	className,
}: ErrorTerminalProps) {
	const tone = SEVERITY_TONE[ERROR_SEVERITY[code]];

	return (
		<div
			className={cn(
				"flex w-full items-center justify-center px-margin-mobile py-12 sm:px-gutter",
				className,
			)}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest font-mono shadow-sm">
				{/* Title bar. The dots are decoration and are hidden from assistive
				    technology; the path beside them is the only thing that carries
				    meaning, so it is the only thing announced. */}
				<div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container px-3 py-2">
					<span aria-hidden="true" className="flex gap-1.5">
						<span className="size-2.5 rounded-full bg-outline-variant" />
						<span className="size-2.5 rounded-full bg-outline-variant" />
						<span className="size-2.5 rounded-full bg-outline-variant" />
					</span>
					<span className="truncate text-xs text-on-surface-variant">
						takda://diagnostics
					</span>
					<span className={cn("ml-auto shrink-0 text-xs tabular-nums", tone)}>
						{code}
					</span>
				</div>

				<div className="space-y-6 p-4 text-sm sm:p-6">
					<p className="truncate text-xs text-on-surface-variant">
						<span className="text-primary">$</span> takda diagnose --status{" "}
						{code}
					</p>

					{/* The art is decorative: a screen reader announcing sixty block
					    characters is noise, and the heading below already carries the
					    same information as words. */}
					{/* Sized in `text-*` steps rather than a fixed width because the
					    glyph is text: three digits is 17 characters, so at `text-lg` the
					    numeral is about 184px and still clears a 320px phone once the
					    page and card padding are taken out. `leading-[0.85]` closes the
					    gap between rows so the blocks read as one solid figure. */}
					<pre
						aria-hidden="true"
						className={cn(
							"overflow-x-auto text-lg leading-[0.85] sm:text-3xl",
							tone,
						)}
					>
						{buildNumeral(code).join("\n")}
					</pre>

					<div className="space-y-2">
						<h1 className="text-lg font-semibold text-on-surface">
							<span className="sr-only">Error {code}: </span>
							{title}
						</h1>
						<p className="max-w-prose font-sans text-sm leading-relaxed text-on-surface-variant">
							{description}
						</p>
					</div>

					<dl className="space-y-1 text-xs text-on-surface-variant">
						<div className="flex gap-2">
							<dt className="w-20 shrink-0 text-outline">status</dt>
							<dd className="min-w-0 break-all">
								{code} {ERROR_STATUS_LABEL[code]}
							</dd>
						</div>
						{reference && (
							<div className="flex gap-2">
								<dt className="w-20 shrink-0 text-outline">reference</dt>
								<dd className="min-w-0 break-all">{reference}</dd>
							</div>
						)}
					</dl>

					<nav aria-label="Recovery routes" className="space-y-2">
						<p className="text-xs text-outline">recovery routes</p>
						<div className="-mx-2 space-y-0.5">
							{routes.map((route) => (
								<TerminalRoute key={route.href} {...route} />
							))}
							{actions}
						</div>
					</nav>

					<p aria-hidden="true" className="text-xs text-on-surface-variant">
						<span className="text-primary">$</span>{" "}
						<span className="animate-caret">▮</span>
					</p>
				</div>
			</div>
		</div>
	);
}
