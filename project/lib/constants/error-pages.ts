import type {
	ErrorPageCode,
	ErrorSeverity,
	RecoveryRoute,
} from "@/lib/types/error-page";

/**
 * ascii numerals font - defines a zero-dependency, five-row block
 * font for error codes to convey a diagnostic, machine-output
 * aesthetic that works responsively without requiring external
 * assets.
 */
export const ASCII_NUMERALS: Record<string, readonly string[]> = {
	"0": ["█████", "█   █", "█   █", "█   █", "█████"],
	"1": ["  ██ ", " ███ ", "  ██ ", "  ██ ", "█████"],
	"2": ["█████", "    █", "█████", "█    ", "█████"],
	"3": ["█████", "    █", " ████", "    █", "█████"],
	"4": ["█   █", "█   █", "█████", "    █", "    █"],
	"5": ["█████", "█    ", "█████", "    █", "█████"],
	"6": ["█████", "█    ", "█████", "█   █", "█████"],
	"7": ["█████", "    █", "   █ ", "  █  ", "  █  "],
	"8": ["█████", "█   █", "█████", "█   █", "█████"],
	"9": ["█████", "█   █", "█████", "    █", "█████"],
};

/**
 * numeral rows count - specifies the fixed height in rows for
 * rendering the ascii numerals.
 */
export const NUMERAL_ROWS = 5;

/**
 * error severity mapping - maps http status codes to visual
 * severities, intentionally keeping 404 neutral to reserve error
 * colors for genuine system faults.
 */
export const ERROR_SEVERITY: Record<ErrorPageCode, ErrorSeverity> = {
	"401": "action",
	"403": "fault",
	"404": "neutral",
	"500": "fault",
};

/**
 * error status labels - maps http status codes to their
 * machine-readable string names for display.
 */
export const ERROR_STATUS_LABEL: Record<ErrorPageCode, string> = {
	"401": "UNAUTHORIZED",
	"403": "FORBIDDEN",
	"404": "NOT_FOUND",
	"500": "INTERNAL_ERROR",
};

/**
 * dashboard recovery routes - defines prioritized navigation links for
 * signed-in users who encounter an error, helping them recover to the
 * most likely desired destinations.
 */
export const DASHBOARD_RECOVERY_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/dashboard", label: "/dashboard", hint: "your workspace overview" },
	{ href: "/projects", label: "/projects", hint: "every project you can open" },
	{ href: "/team", label: "/team", hint: "the people directory" },
];

/**
 * public recovery routes - provides safe navigation links for
 * signed-out users, deliberately omitting protected routes to prevent
 * frustrating redirect loops upon recovery.
 */
export const PUBLIC_RECOVERY_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/", label: "/", hint: "back to the landing page" },
	{ href: "/sign-in", label: "/sign-in", hint: "sign in to your account" },
	{ href: "/sign-up", label: "/sign-up", hint: "create a new account" },
];
