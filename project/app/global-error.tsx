"use client";

import { useEffect } from "react";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { TerminalAction } from "@/components/ui/error-terminal/terminal-routes";
import { PUBLIC_RECOVERY_ROUTES } from "@/lib/constants/error-pages";
import "./globals.css";

/**
 * The last boundary: a throw inside the root layout itself.
 *
 * ## Why this file has to render its own `<html>` and `<body>`
 *
 * Every other error file renders *inside* the root layout. This one exists
 * precisely because the root layout failed, so it replaces it - which means the
 * document shell is its responsibility, and `globals.css` has to be imported
 * here rather than inherited.
 *
 * ## Why it deliberately loads nothing else
 *
 * No `ClerkProvider`, no theme provider, no webfont. Each of those is a thing
 * that could be the reason the layout threw in the first place, and a fallback
 * that depends on the thing it is a fallback for is not a fallback. The mono
 * stack degrades to the system's own `ui-monospace`, which is exactly the right
 * trade here: the block numerals still line up, and the page cannot fail for the
 * same reason twice.
 *
 * In development Next shows its own overlay instead, so this is only ever seen
 * in a production build.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Root layout error:", error);
	}, [error]);

	return (
		<html lang="en">
			<body className="bg-background text-foreground">
				<ErrorTerminal
					code="500"
					title="The application failed to start"
					description="Takda PH could not load its own shell, so nothing on this page rendered. This is a fault on our side. Retrying will attempt a fresh load."
					reference={error.digest}
					routes={PUBLIC_RECOVERY_ROUTES}
					className="min-h-screen"
					actions={
						<TerminalAction
							onClick={reset}
							label="retry"
							hint="attempt a fresh load"
						/>
					}
				/>
			</body>
		</html>
	);
}
