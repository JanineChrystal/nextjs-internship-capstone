import {
	clerkClient,
	clerkMiddleware,
	createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Everything behind the dashboard shell. Listed explicitly rather than matched
// by exclusion so that adding a public page never accidentally locks it.
const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/projects(.*)",
	"/team(.*)",
	"/calendar(.*)",
	"/analytics(.*)",
	"/settings(.*)",
	"/profile(.*)",
]);

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SESSION_START_COOKIE = "takda_session_started_at";

/**
 * Reads the cached session start time, so the 24-hour cap does not have to ask
 * Clerk on every request.
 *
 * The value is `sessionId:timestamp`, not a bare timestamp. Keying it to the
 * session matters: signing out and back in issues a new session, and a bare
 * timestamp would leave the fresh session carrying the old clock and expiring
 * immediately.
 *
 * A miss is not a licence to restart the clock - the caller re-reads the true
 * start from Clerk instead. This cookie is a cache, never the source of truth,
 * because the instance is on a plan where Clerk's own session lifetime is fixed
 * at 7 days and cannot back this cap up.
 */
function readSessionStart(
	raw: string | undefined,
	sessionId: string,
): number | null {
	if (!raw) return null;

	const separator = raw.lastIndexOf(":");
	if (separator === -1) return null;

	const recordedSessionId = raw.slice(0, separator);
	const startedAt = Number(raw.slice(separator + 1));

	if (recordedSessionId !== sessionId) return null;
	return Number.isFinite(startedAt) ? startedAt : null;
}

export default clerkMiddleware(async (auth, req) => {
	if (!isProtectedRoute(req)) return NextResponse.next();

	const { userId, sessionId } = await auth();

	// Turned away at the edge, before any page code runs, so a lapsed session
	// never reaches the dashboard shell.
	if (!userId || !sessionId) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	const cachedStart = readSessionStart(
		req.cookies.get(SESSION_START_COOKIE)?.value,
		sessionId,
	);
	const now = Date.now();

	// The cookie is only a cache. When it is missing - a new session, or someone
	// clearing site data - the real start time is read back from Clerk rather
	// than reset to now. Without this, deleting one cookie would restart the 24
	// hours, and there is no dashboard session limit behind us to catch it.
	let startedAt = cachedStart;
	if (startedAt === null) {
		try {
			const client = await clerkClient();
			const session = await client.sessions.getSession(sessionId);
			startedAt = session.createdAt;
		} catch (error) {
			// Falling back to "now" keeps the app usable if Clerk is unreachable.
			// It is the lenient direction, but the alternative is locking everyone
			// out over a transient API failure.
			console.error("Failed to read session start from Clerk:", error);
			startedAt = now;
		}
	}

	if (now - startedAt > SESSION_MAX_AGE_MS) {
		// Revoked with Clerk, not merely blocked here. Clearing our own cookie
		// alone would leave the Clerk session live, so the next request would mint
		// a fresh cookie and silently restart the 24 hours.
		try {
			const client = await clerkClient();
			await client.sessions.revokeSession(sessionId);
		} catch (error) {
			console.error("Failed to revoke expired session:", error);
		}

		const expired = NextResponse.redirect(
			new URL("/?session=expired", req.url),
		);
		expired.cookies.delete(SESSION_START_COOKIE);
		return expired;
	}

	const response = NextResponse.next();

	// Cached so the Clerk lookup above happens once per session rather than on
	// every request. It stores the real start time, so the 24 hours is measured
	// from sign-in rather than from the most recent page view.
	if (cachedStart === null) {
		response.cookies.set(SESSION_START_COOKIE, `${sessionId}:${startedAt}`, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: SESSION_MAX_AGE_MS / 1000,
		});
	}

	return response;
});

export const config = {
	matcher: [
		// skip Next.js internals, static files, and the webhooks route
		"/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// always run for API routes, except for the webhooks path
		"/(api(?!/webhooks)|trpc)(.*)",
		// always run for Clerk-specific frontend API routes
		"/__clerk/(.*)",
	],
};
