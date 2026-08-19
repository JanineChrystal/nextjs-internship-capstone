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

// 3. Create the global sliding window rate limiter (100 requests per 10 seconds)
export const globalRateLimiter = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(100, "10 s"),
	analytics: true,
	prefix: "@upstash/ratelimit/global",
});
