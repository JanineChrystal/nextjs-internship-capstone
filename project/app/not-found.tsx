import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { PUBLIC_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "404 Not Found",
};

/**
 * The catch-all 404, reached by any address that matches no route.
 *
 * The routes offered are the public set. Whoever lands here may well be signed
 * out - a bad link in an email, or a stale bookmark - and pointing them at
 * `/projects` would bounce them through sign-in, which reads as a second
 * failure rather than a way out. Signed-in readers get the dashboard set from
 * `app/(dashboard)/not-found.tsx` instead.
 */
export default function NotFound() {
	return (
		<ErrorTerminal
			code="404"
			title="Route not found"
			description="Nothing is served at this address. It was most likely mistyped, or it pointed at something that has since been renamed or deleted."
			routes={PUBLIC_RECOVERY_ROUTES}
			className="min-h-screen"
		/>
	);
}
