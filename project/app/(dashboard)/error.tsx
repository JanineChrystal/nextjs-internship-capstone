"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/buttons/button";

/**
 * Recovery boundary for the dashboard.
 *
 * The data layer signals a refusal by throwing - getTasksByProjectId and its
 * siblings throw "Unauthorized" rather than returning an empty list, so that a
 * denial is never mistaken for an empty project. Without a boundary those throws
 * blank the whole page, so this is the surface those throws assume exists.
 */
export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Dashboard route error:", error);
	}, [error]);

	const isAccessError = /unauthorized|forbidden|not found/i.test(error.message);

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
			<AlertCircle className="h-10 w-10 text-error" />

			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-on-surface">
					{isAccessError
						? "You do not have access to this"
						: "Something went wrong"}
				</h2>
				<p className="max-w-md text-sm text-secondary">
					{isAccessError
						? "This project or workspace is not shared with you, or your access was removed. Ask the owner to invite you again."
						: "This page could not be loaded. Trying again usually resolves it."}
				</p>
			</div>

			{/* The digest is the only handle on the server-side stack, which is
			    stripped from the client in production. */}
			{error.digest && (
				<p className="text-xs text-secondary/70">Reference: {error.digest}</p>
			)}

			<div className="flex items-center gap-2">
				<Button type="button" onClick={reset} className="gap-2">
					<RotateCcw className="h-4 w-4" />
					Try again
				</Button>
				<Button type="button" variant="outline" asChild>
					<Link href="/projects">Back to projects</Link>
				</Button>
			</div>
		</div>
	);
}
