import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "403 Forbidden",
};

/**
 * forbidden page - explicitly omits a retry control for 403 responses
 * since retrying will not bypass server-enforced access restrictions.
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
