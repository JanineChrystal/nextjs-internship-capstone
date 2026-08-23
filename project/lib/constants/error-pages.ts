import type {
	ErrorPageCode,
	ErrorSeverity,
	RecoveryRoute,
} from "@/lib/types/error-page";

/**
 * A five-row block font, one entry per digit.
 *
 * ## Why the numeral is drawn rather than typed
 *
 * A status code set in the body typeface is a number on a page. Printed as
 * block glyphs it reads as machine output - which is the whole idea: the screen
 * is a diagnosis, not an apology. It also survives at any size without an image
 * or an icon font, so there is no asset to load on a route that is, by
 * definition, already going wrong.
 *
 * All ten digits are here even though only 0, 1, 3, 4 and 5 are reachable from
 * `ErrorPageCode` today. A font with holes in it is a trap for whoever adds the
 * next code.
 *
 * Five rows is a deliberate ceiling. Taller glyphs look better on a desktop hero
 * and then force a horizontal scroll on a phone, and an error page that cannot
 * be read on the device that hit the error is worse than a plain heading.
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

/** Rows in every glyph. Used to build the numeral line by line. */
export const NUMERAL_ROWS = 5;

/**
 * The severity each code is drawn at.
 *
 * Note that 404 is `neutral`. Colouring a mistyped address in the error colour
 * tells the reader something is broken when nothing is, and it spends the alarm
 * signal on the most common and least serious case - so when 500 uses the same
 * red it no longer means anything.
 */
export const ERROR_SEVERITY: Record<ErrorPageCode, ErrorSeverity> = {
	"401": "action",
	"403": "fault",
	"404": "neutral",
	"500": "fault",
};

/** The short machine name printed beside the code, e.g. `404 NOT_FOUND`. */
export const ERROR_STATUS_LABEL: Record<ErrorPageCode, string> = {
	"401": "UNAUTHORIZED",
	"403": "FORBIDDEN",
	"404": "NOT_FOUND",
	"500": "INTERNAL_ERROR",
};

/**
 * Where a signed-in reader can go from a dead end.
 *
 * Ordered by how likely each is to be what they wanted, not alphabetically. The
 * first line is the one someone will take without reading the rest.
 */
export const DASHBOARD_RECOVERY_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/dashboard", label: "/dashboard", hint: "your workspace overview" },
	{ href: "/projects", label: "/projects", hint: "every project you can open" },
	{ href: "/team", label: "/team", hint: "the people directory" },
];

/**
 * Where a signed-out reader can go.
 *
 * Deliberately not the dashboard set. Offering `/projects` to someone who is not
 * signed in sends them through a redirect back to sign-in, which reads as a
 * second failure rather than a recovery.
 */
export const PUBLIC_RECOVERY_ROUTES: readonly RecoveryRoute[] = [
	{ href: "/", label: "/", hint: "back to the landing page" },
	{ href: "/sign-in", label: "/sign-in", hint: "sign in to your account" },
	{ href: "/sign-up", label: "/sign-up", hint: "create a new account" },
];
