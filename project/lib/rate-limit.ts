import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
	throw new Error("Missing Upstash Redis environment variables in process.env");
}

// 1. Initialize Redis now that TS knows these strings exist
const redis = new Redis({
	url: redisUrl,
	token: redisToken,
});

// 2. Create the sliding window rate limiter (5 requests per 10 seconds)
export const actionRateLimiter = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(5, "10 s"),
	analytics: true,
	prefix: "@upstash/ratelimit",
});

/**
 * Invitations: 10 per minute, per account.
 *
 * A looser window than the contact form on purpose. That form is anonymous and
 * public, so it is limited by IP and tuned tight. An invite is authenticated,
 * and the thing being limited is a person adding their own colleagues - so the
 * window has to clear a realistic burst. Ten in a minute lets someone onboard a
 * whole team in one sitting while still stopping a script.
 *
 * Keyed by user id rather than IP: two colleagues behind one office connection
 * are not one abuser, and limiting them together would make the app feel broken
 * for the second person to try.
 *
 * This exists because an invite is the one path where a signed-in user chooses
 * the recipient of an outbound email, which is the ingredient an open relay
 * needs.
 */
export const inviteRateLimiter = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(10, "60 s"),
	analytics: true,
	prefix: "@upstash/ratelimit/invite",
});

// 3. Create the global sliding window rate limiter (100 requests per 10 seconds)
export const globalRateLimiter = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(100, "10 s"),
	analytics: true,
	prefix: "@upstash/ratelimit/global",
});
