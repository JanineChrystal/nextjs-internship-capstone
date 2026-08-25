"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { TerminalAction } from "@/components/ui/error-terminal/terminal-routes";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";
import type { RecoveryRoute } from "@/lib/types/error-page";

/** sign-in routes - offered on the 401 branch where authentication is required. */
const SIGN_IN_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/sign-in", label: "/sign-in", hint: "sign in and come back" },
	...DASHBOARD_RECOVERY_ROUTES,
];

/**
 * dashboard error boundary - handles DAL access refusals by sniffing error
 * messages and checking Clerk session state to distinguish between 401
 * (expired session) and 403 (revoked access) instead of showing a generic 500.
 */
export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const { isLoaded, isSignedIn } = useAuth();

	useEffect(() => {
		console.error("Dashboard route error:", error);
	}, [error]);

	const isAccessError = /unauthorized|forbidden/i.test(error.message);

	// delay 401 check - waits for Clerk to fully load before claiming a 401 to prevent flashing a sign-in screen to authenticated users.
	if (isAccessError && isLoaded && !isSignedIn) {
		return (
			<ErrorTerminal
				code="401"
				title="Your session has ended"
				description="You are not signed in, so this view could not be loaded. Signing in again will bring you straight back."
				reference={error.digest}
				routes={SIGN_IN_ROUTES}
				className="min-h-[60vh]"
			/>
		);
	}

	if (isAccessError) {
		return (
			<ErrorTerminal
				code="403"
				title="You do not have access to this"
				description="This project or workspace is not shared with you, or your access was removed. Ask the owner to invite you again - retrying will not change the answer."
				reference={error.digest}
				routes={DASHBOARD_RECOVERY_ROUTES}
				className="min-h-[60vh]"
			/>
		);
	}

	return (
		<ErrorTerminal
			code="500"
			title="This page could not be loaded"
			description="Something failed while building this view. Trying again usually resolves it. If it keeps happening, quote the reference below."
			reference={error.digest}
			routes={DASHBOARD_RECOVERY_ROUTES}
			className="min-h-[60vh]"
			actions={
				<TerminalAction
					onClick={reset}
					label="retry"
					hint="load this view again"
				/>
			}
		/>
	);
}
