import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";
import type { RecoveryRoute } from "@/lib/types/error-page";

export const metadata: Metadata = {
	title: "401 Account not ready",
};

/**
 * unauthorized page component - functions as a waiting room for newly signed-up
 * users whose account records are still being created by Clerk webhooks,
 * offering a re-authentication route to pick up delayed records.
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
