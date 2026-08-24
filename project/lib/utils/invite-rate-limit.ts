import "server-only";

/**
 * Whether this account may send another invitation right now.
 *
 * The limiter is imported lazily inside the try, copying the pattern in
 * `contact-actions.ts`: `lib/rate-limit.ts` throws at module scope when the
 * Upstash variables are missing, and a static import would make every file that
 * touches invitations unbuildable on a deployment that forgot one.
 *
 * Fails OPEN. If the limiter is unreachable the invitation proceeds - blocking
 * a real person from adding a colleague because a rate-limiting service is down
 * is a worse failure than letting one extra invitation through. Same direction
 * as the contact form, for the same reason.
 *
 * Shared by both invite paths rather than written twice: project and workspace
 * invitations are the same risk and should not be able to drift apart.
 */
export async function isWithinInviteRateLimit(
	userId: string,
): Promise<boolean> {
	try {
		const { inviteRateLimiter } = await import("@/lib/rate-limit");
		const { success } = await inviteRateLimiter.limit(`invite:${userId}`);
		return success;
	} catch (error) {
		console.error("Invite rate limiter unavailable:", error);
		return true;
	}
}

/** invite rate limit message - shown when the window is exhausted. Says what to do, not what went wrong. */
export const INVITE_RATE_LIMIT_MESSAGE =
	"You have sent a lot of invitations just now. Wait a minute and try again.";
