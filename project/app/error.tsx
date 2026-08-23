"use client";

import { useEffect } from "react";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { TerminalAction } from "@/components/ui/error-terminal/terminal-routes";
import { PUBLIC_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

/**
 * The recovery boundary for everything outside the dashboard - the landing
 * page, the contact form, and the Clerk sign-in and sign-up routes.
 *
 * Only the dashboard had a boundary before this, so a throw anywhere in the
 * public or auth segments fell through to Next's built-in screen: an unstyled
 * page in production that says nothing and offers no way back.
 */
export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Unhandled route error:", error);
	}, [error]);

	return (
		<ErrorTerminal
			code="500"
			title="Something failed on our side"
			description="This page could not be rendered. The fault is ours, not yours - retrying usually clears it, and the reference below identifies this exact failure if you need to report it."
			reference={error.digest}
			routes={PUBLIC_RECOVERY_ROUTES}
			className="min-h-screen"
			actions={
				<TerminalAction
					onClick={reset}
					label="retry"
					hint="render this route again"
				/>
			}
		/>
	);
}
