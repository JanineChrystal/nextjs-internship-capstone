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
 * severity tone - defines text colors based on error severity. Uses
 * `on-surface-variant` for neutral tones to maintain adequate contrast for
 * large elements, avoiding the lower-contrast `outline` color.
 */
const SEVERITY_TONE = {
	neutral: "text-on-surface-variant",
	action: "text-primary",
	fault: "text-error",
} as const;

/**
 * build numeral - translates an error code into ASCII block art row by row,
 * processing digit by digit for each line to ensure the numerals render side
 * by side horizontally.
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
	/** one-line diagnosis - a concise summary of the error, rendered as the main page heading. */
	title: string;
	/** plain language description - explains the error cause and possible next steps in user-friendly terms. */
	description: string;
	/** recovery routes - a list of navigation options to help the user escape the error state. */
	routes: readonly RecoveryRoute[];
	/**
	 * error digest - displays the server error digest hash so users can quote
	 * it in bug reports, as full stack traces are stripped in production.
	 */
	reference?: string;
	/** action handlers - supplementary recovery elements that trigger functions instead of navigating. */
	actions?: React.ReactNode;
	/** wrapper classes - custom styling applied to the centering container for flexible height control. */
	className?: string;
}

/**
 * error terminal - a unified, server-renderable terminal-themed error screen
 * that centralizes layout for 401, 403, 404, and 500 errors. Avoids client
 * components by managing animations in CSS and accepting interactive
 * recovery actions solely through props.
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
				{/* accessible title bar - hides the decorative window controls from screen readers, leaving only the meaningful path text. */}
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

					{/* decorative block art - hides the ASCII art from screen readers as the numerical value is available elsewhere. */}
					{/* text-based sizing - scales the ASCII art via font size for fluid responsiveness and tightens leading for a solid appearance. */}
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
