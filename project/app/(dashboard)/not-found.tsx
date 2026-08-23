import type { Metadata } from "next";
import { ErrorTerminal } from "@/components/ui/error-terminal/error-terminal";
import { DASHBOARD_RECOVERY_ROUTES } from "@/lib/constants/error-pages";

export const metadata: Metadata = {
	title: "404 Not Found",
};

/**
 * The 404 for anything inside the signed-in app.
 *
 * Separate from the root `not-found.tsx` for two reasons. It renders inside the
 * dashboard layout, so the sidebar and top bar stay put and the reader is still
 * somewhere rather than being ejected to a bare page. And it can offer the
 * dashboard recovery routes, which are only useful to someone already signed in.
 *
 * This is also the surface `notFound()` unwinds to when a DAL lookup returns
 * nothing for a project or task id - previously that fell through to the root
 * handler, which did not exist, so the reader got Next's built-in screen.
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
