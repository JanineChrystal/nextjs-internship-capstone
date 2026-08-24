import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { PUBLIC_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "401 Unauthorized",
};

/**
 * Rendered when `unauthorized()` is called outside the dashboard segment.
 *
 * This is the `experimental.authInterrupts` counterpart to `not-found.tsx`:
 * calling `unauthorized()` from a server component unwinds to this file the same
 * way `notFound()` unwinds to that one, which is what lets a data-layer refusal
 * become a page without every caller hand-rolling a redirect.
 */
export default function Unauthorized() {
	return (
		<ErrorTerminal
			code="401"
			title="You need to be signed in"
			description="This page is only served to a signed-in account. Signing in will bring you straight back here."
			routes={PUBLIC_RECOVERY_ROUTES}
			className="min-h-screen"
		/>
	);
}
