/**
 * error page code - closed union of supported HTTP status codes that the
 * shared error screen can accurately diagnose and provide recovery routes for,
 * preventing rendering of generic codes without context.
 */
export type ErrorPageCode = "401" | "403" | "404" | "500";

/**
 * error severity - categorizes the presentation tone of an error code,
 * distinguishing between address issues (neutral), actionable refusals (action),
 * and hard system or access failures (fault).
 */
export type ErrorSeverity = "neutral" | "action" | "fault";

/**
 * recovery route - describes a single actionable path in the error screen's
 * recovery block, requiring an explanatory hint to assist the user in choosing
 * their next step.
 */
export interface RecoveryRoute {
	/** Where the line navigates. Internal paths only - these render as `Link`s. */
	href: string;
	/** The path as printed, e.g. `/projects`. */
	label: string;
	/** What the reader gets by taking it. */
	hint: string;
}
