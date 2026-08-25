"use client";

import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";

/**
 * session expired notice - a client component that reads URL parameters
 * to display an expiration warning, keeping the main page prerendered
 * rather than opting into dynamic rendering.
 */
export function SessionExpiredNotice() {
	const searchParams = useSearchParams();

	if (searchParams.get("session") !== "expired") return null;

	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
			<div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100">
				<Clock className="mt-0.5 h-5 w-5 shrink-0" />
				<div>
					<p className="font-semibold">Your session expired</p>
					<p className="text-sm">
						Sessions last 24 hours. Please sign in again to get back to your
						projects.
					</p>
				</div>
			</div>
		</div>
	);
}
