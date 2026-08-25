import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "404 Not Found",
};

/**
 * dashboard not-found page - renders a contextual 404 error within the
 * dashboard layout that includes authenticated recovery routes instead of
 * ejecting users to the root bare page.
 */
export default function DashboardNotFound() {
	return (
		<ErrorTerminal
			code="404"
			title="That does not exist here"
			description="The project, task or page at this address could not be found. It may have been deleted or archived, or the link may be out of date."
			routes={DASHBOARD_RECOVERY_ROUTES}
			className="min-h-[60vh]"
		/>
	);
}
