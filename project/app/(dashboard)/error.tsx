"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { TerminalAction } from "@/components/ui/error-terminal/terminal-routes";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";
import type { RecoveryRoute } from "@/lib/types/error-page";

/** Offered on the 401 branch, where signing in is the actual remedy. */
const SIGN_IN_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/sign-in", label: "/sign-in", hint: "sign in and come back" },
	...DASHBOARD_RECOVERY_ROUTES,
];

/**
 * Recovery boundary for the dashboard.
 *
 * The data layer signals a refusal by throwing - getTasksByProjectId and its
 * siblings throw "Unauthorized" rather than returning an empty list, so that a
 * denial is never mistaken for an empty project. Without a boundary those throws
 * blank the whole page, so this is the surface those throws assume exists.
 *
 * ## Why the code is decided here rather than fixed at 500
 *
 * A refusal that arrives as a thrown Error is still a refusal. Drawing it as
 * `500 INTERNAL_ERROR` would tell someone whose access was revoked that our
 * server is broken, and send them into a retry loop that cannot succeed. The
 * message is sniffed to separate the two, and the screen changes its code, its
 * wording and - crucially - whether it offers a retry at all.
 *
 * ## Why the session is checked as well as the message
 *
 * The DAL's refusal is ambiguous on its own. It throws the literal string
 * "Unauthorized" from `if (!user)` in 96 places, and `getCurrentUser()` returns
 * null both when nobody is signed in AND when a signed-in user has no row - two
 * conditions with opposite remedies. Reading the message alone would tell
 * someone whose session merely expired to "ask the owner to invite you again",
 * which is exactly the confusion `SESSION_EXPIRED_ERROR` in lib/dal/auth.ts was
 * introduced to stop.
 *
 * This boundary is a client component living under `ClerkProvider`, so it can
 * simply ask whether there is a session - the one fact the error message is
 * missing. No session means 401 and sign in; a live session means 403 and the
 * answer will not change on a retry.
 *
 * Sniffing a message string is still not the durable answer; a typed error
 * carrying its own status would be. It is what the DAL throws today, and
 * pretending otherwise would just move the guess somewhere less visible.
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

	// Only claim 401 once Clerk has actually resolved. While `isLoaded` is false
	// `isSignedIn` is undefined, and treating that as signed-out would flash a
	// "sign in" screen at someone who is already signed in.
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
