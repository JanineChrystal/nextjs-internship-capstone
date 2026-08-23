import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";
import type { RecoveryRoute } from "@/lib/types/error-page";

export const metadata: Metadata = {
	title: "401 Account not ready",
};

/**
 * An expired session now redirects through sign-in instead of landing here, so
 * the only way to reach this page is signed in with no matching account record -
 * which the Clerk webhook creates moments after signup.
 *
 * That makes this a waiting room rather than a refusal, which is why the first
 * recovery route is "sign in again": if the webhook did land and the session is
 * simply stale, a fresh sign-in is what picks the new record up.
 */
const ROUTES: readonly RecoveryRoute[] = [
	{
		href: "/sign-in",
		label: "/sign-in",
		hint: "sign in again to refresh your account",
	},
	...DASHBOARD_RECOVERY_ROUTES,
];

export default function UnauthorizedPage() {
	return (
		<ErrorTerminal
			code="401"
			title="Your account is still being set up"
			description="You are signed in, but your account record has not finished being created. This usually takes a moment after signing up - reload the page, or sign in again if it persists."
			routes={ROUTES}
			className="min-h-[60vh]"
		/>
	);
}
