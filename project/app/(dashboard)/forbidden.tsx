import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "403 Forbidden",
};

/**
 * Rendered when `forbidden()` is called from inside the dashboard - a member
 * opening a project they are not on, or reaching a moderation surface reserved
 * for owners.
 *
 * No retry is offered, deliberately. The answer to a 403 does not change on a
 * second attempt, and a retry control that cannot succeed teaches people to
 * distrust every retry control in the product.
 */
export default function ForbiddenPage() {
	return (
		<ErrorTerminal
			code="403"
			title="This is not shared with your account"
			description="You are signed in, but you do not have permission to open this. If you think that is wrong, ask the project owner or your workspace admin to add you."
			routes={DASHBOARD_RECOVERY_ROUTES}
			className="min-h-[60vh]"
		/>
	);
}
