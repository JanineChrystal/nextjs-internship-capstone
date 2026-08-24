/**
 * The public base URL of this app, with no trailing slash.
 *
 * Emails carry links back into the app, and those links have to be absolute -
 * a relative path in an inbox goes nowhere. So every environment needs to know
 * its own address, and the three environments here have three different ones:
 * localhost, a Vercel preview branch alias, and the production domain.
 *
 * Hand-setting a variable in each environment is the obvious approach and the
 * one this replaces, because it fails quietly. A missing or stale value falls
 * back to localhost and the app keeps working perfectly - right up until someone
 * opens an invite email and clicks a link to their own machine.
 *
 * Vercel already injects the correct answer at runtime, so the platform is asked
 * instead of a human being asked to remember:
 *
 *   APP_URL                        an explicit override, for a custom domain
 *   VERCEL_PROJECT_PRODUCTION_URL  the production domain, on production only
 *   VERCEL_BRANCH_URL              the branch alias, stable across redeploys
 *   VERCEL_URL                     the per-deployment URL, always present
 *   localhost                      development
 *
 * These are read at request time rather than inlined at build time, which is why
 * none of them carry a NEXT_PUBLIC_ prefix: every caller is a server action, so
 * the value never needs to reach the browser. A NEXT_PUBLIC_ variable would be
 * frozen into the bundle at build time, meaning a corrected value would not take
 * effect until the next deployment.
 */
export function getAppBaseUrl(): string {
	const candidates = [
		process.env.APP_URL,
		// Only trust the production domain when this actually IS production -
		// Vercel sets this variable on preview deployments too, and a preview
		// sending people to the production site would be a confusing bug.
		process.env.VERCEL_ENV === "production"
			? process.env.VERCEL_PROJECT_PRODUCTION_URL
			: undefined,
		process.env.VERCEL_BRANCH_URL,
		process.env.VERCEL_URL,
	];

	for (const candidate of candidates) {
		if (candidate) return withProtocol(candidate.replace(/\/+$/, ""));
	}

	return "http://localhost:3000";
}

/** with protocol - Vercel's variables omit the scheme; an explicit override usually includes it. */
function withProtocol(host: string): string {
	return /^https?:\/\//.test(host) ? host : `https://${host}`;
}
