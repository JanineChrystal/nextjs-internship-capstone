import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { PUBLIC_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "403 Forbidden",
};

/**
 * Rendered when `forbidden()` is called outside the dashboard segment.
 *
 * The distinction from 401 is worth keeping precise, because the two are
 * routinely conflated: 401 means we do not know who you are, and signing in
 * fixes it. 403 means we know exactly who you are and the answer is still no -
 * so the recovery routes lead elsewhere rather than to sign-in, which would
 * change nothing.
 */
export default function Forbidden() {
	return (
		<ErrorTerminal
			code="403"
			title="Your account cannot open this"
			description="You are signed in, but this resource is not shared with your account. Signing in again will not change that - ask whoever owns it to invite you."
			routes={PUBLIC_RECOVERY_ROUTES}
			className="min-h-screen"
		/>
	);
}
